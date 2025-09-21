import { google } from "googleapis"
export function getAcademicYear(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-based
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`
}
export function getGoogleClients() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  })
  const drive = google.drive({ version: "v3", auth })
  const sheets = google.sheets({ version: "v4", auth })
  return { drive, sheets }
}
export async function ensureConfigSheet(drive: any, sheets: any) {
  const fixedId = process.env.CONFIG_SPREADSHEET_ID
  if (fixedId) {
    // Optionally, verify it exists once
    try {
      await sheets.spreadsheets.get({ spreadsheetId: fixedId })
      return fixedId
    } catch (e) {
      throw new Error("CONFIG_SPREADSHEET_ID is invalid or not shared with the service account")
    }
  }
  // Fallback to legacy behavior (search + create) — but this hits quota if storage is full
  const search = await drive.files.list({
    q: "name='Club Registration Config' and mimeType='application/vnd.google-apps.spreadsheet'",
    fields: "files(id, name)",
  })
  let configId = search.data.files?.[0]?.id
  if (!configId) {
    const created = await drive.files.create({
      requestBody: {
        name: "Club Registration Config",
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
    })
    configId = created.data.id
    if (!configId) throw new Error("Failed to create config sheet")
    await sheets.spreadsheets.values.update({
      spreadsheetId: configId,
      range: "A1:E1",
      valueInputOption: "RAW",
      requestBody: {
        values: [["clubId", "clubName", "sheetId", "academicYear", "updatedAt"]],
      },
    })
  }
  return configId
}
export type ClubConfigRow = {
  clubId: string
  clubName: string
  sheetId: string
  academicYear: string
  updatedAt: string
}
export async function readConfigForYear(
  sheets: any,
  configId: string,
  academicYear: string
): Promise<ClubConfigRow[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: configId,
    range: "A2:E",
  })
  const rows = (res.data.values || []) as string[][]
  return rows
    .map((r) => ({
      clubId: r[0] || "",
      clubName: r[1] || "",
      sheetId: r[2] || "",
      academicYear: r[3] || "",
      updatedAt: r[4] || "",
    }))
    .filter((r) => r.academicYear === academicYear)
}
export async function upsertConfigRows(
  sheets: any,
  configId: string,
  updates: Array<{ clubId: string; clubName: string; sheetId: string }>,
  academicYear: string
) {
  // Load all rows to find upsert positions
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: configId,
    range: "A2:E",
  })
  const rows = (res.data.values || []) as string[][]
  const now = new Date().toISOString()
  const idxByKey = new Map<string, number>() // key=clubId|year, value=index in rows
  rows.forEach((r, i) => {
    const key = `${r[0] || ""}|${r[3] || ""}`
    idxByKey.set(key, i)
  })
  const dataToUpdate: { range: string; values: string[][] }[] = []
  const dataToAppend: string[][] = []
  for (const u of updates) {
    const key = `${u.clubId}|${academicYear}`
    const existingIdx = idxByKey.get(key)
    if (existingIdx !== undefined) {
      const rowNumber = existingIdx + 2 // since data starts at row 2
      dataToUpdate.push({
        range: `A${rowNumber}:E${rowNumber}`,
        values: [[u.clubId, u.clubName, u.sheetId, academicYear, now]],
      })
    } else {
      dataToAppend.push([u.clubId, u.clubName, u.sheetId, academicYear, now])
    }
  }
  if (dataToUpdate.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: configId,
      requestBody: {
        data: dataToUpdate,
        valueInputOption: "RAW",
      },
    })
  }
  if (dataToAppend.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: configId,
      range: "A:E",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: dataToAppend,
      },
    })
  }
}

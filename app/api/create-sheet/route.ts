import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import {
  getAcademicYear,
  getGoogleClients,
  ensureConfigSheet,
  upsertConfigRows,
} from "@/app/lib/google"

export async function POST(request: NextRequest) {
  try {
    const { clubName } = await request.json()
    const clubId = (clubName || "").toLowerCase().replace(/\s+/g, "-") // Generate stable clubId

    const academicYear = getAcademicYear() // Use helper

    // Initialize Google APIs
    const { drive, sheets } = getGoogleClients() // Use helper

    const searchResponse = await drive.files.list({
      q: `name='${clubName} Registration ${academicYear}' and mimeType='application/vnd.google-apps.spreadsheet'`,
      fields: "files(id, name)",
    })

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      // Sheet already exists for this academic year
      const existingSheet = searchResponse.data.files[0]

      // Upsert into config
      const configId = await ensureConfigSheet(drive, sheets)
      await upsertConfigRows(
        sheets,
        configId,
        [{ clubId, clubName, sheetId: existingSheet.id as string }],
        academicYear
      )

      return NextResponse.json({
        sheetId: existingSheet.id,
        message: `Sheet for ${clubName} ${academicYear} already exists`,
        existing: true,
      })
    }

    const createResponse = await drive.files.create({
      requestBody: {
        name: `${clubName} Registration ${academicYear}`,
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
    })

    const sheetId = createResponse.data.id

    if (!sheetId) {
      throw new Error("Failed to create spreadsheet")
    }

    // Upsert into config
    const configId = await ensureConfigSheet(drive, sheets)
    await upsertConfigRows(sheets, configId, [{ clubId, clubName, sheetId }], academicYear)

    // Add column headers
    const headers = [
      "Timestamp",
      "Email Address",
      "What is your name (First and Last)?",
      "What grade are you in this year?",
      "We will be taking photos of club activities this year. These photos may also be used in the yearbook and club media. Do you agree to being subject of photography?",
      "Discord Username (Optional)",
    ]

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "A1:F1",
      valueInputOption: "RAW",
      requestBody: {
        values: [headers],
      },
    })

    // Format headers (bold)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 6,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true,
                  },
                },
              },
              fields: "userEnteredFormat.textFormat.bold",
            },
          },
        ],
      },
    })

    return NextResponse.json({
      sheetId,
      message: `Created new sheet for ${clubName} ${academicYear}`,
      existing: false,
    })
  } catch (error) {
    console.error("Error creating sheet:", error)
    return NextResponse.json({ error: "Failed to create sheet" }, { status: 500 })
  }
}

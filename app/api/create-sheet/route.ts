import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function POST(request: NextRequest) {
  try {
    const { clubName } = await request.json()

    const now = new Date()
    const currentYear = now.getFullYear()
    const academicYear =
      now.getMonth() >= 7
        ? // August or later = new academic year
          `${currentYear}/${currentYear + 1}`
        : `${currentYear - 1}/${currentYear}`

    // Initialize Google APIs
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"],
    })

    const drive = google.drive({ version: "v3", auth })
    const sheets = google.sheets({ version: "v4", auth })

    const searchResponse = await drive.files.list({
      q: `name='${clubName} Registration ${academicYear}' and mimeType='application/vnd.google-apps.spreadsheet'`,
      fields: "files(id, name)",
    })

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      // Sheet already exists for this academic year
      const existingSheet = searchResponse.data.files[0]
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

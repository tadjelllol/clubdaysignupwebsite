import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

export async function POST(request: NextRequest) {
  try {
    const { sheetId, data } = await request.json()

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // Append data to sheet
    const values = [[data.timestamp, data.email, data.name, data.grade, data.photoConsent, data.discord]]

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A:F",
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting registration:", error)
    return NextResponse.json({ error: "Failed to submit registration" }, { status: 500 })
  }
}

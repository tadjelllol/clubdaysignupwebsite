import { NextResponse } from "next/server"
import { google } from "googleapis"
export async function GET() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ""
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || ""
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: rawKey?.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    })
    const drive = google.drive({ version: "v3", auth })
    const testList = await drive.files.list({ pageSize: 1, fields: "files(id,name)" })
    const created = await drive.files.create({
      requestBody: {
        name: "TEMP_DIAG_DELETE_ME",
        mimeType: "application/vnd.google-apps.spreadsheet",
      },
    })
    const createdId = created.data.id || null
    if (createdId) {
      await drive.files.delete({ fileId: createdId })
    }
    return NextResponse.json({
      ok: true,
      serviceAccountEmail: email,
      privateKeyLooksNonEmpty: !!rawKey,
      driveListOk: !!testList?.data,
      createDeleteOk: !!createdId,
    })
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        serviceAccountEmail: email,
        privateKeyLooksNonEmpty: !!rawKey,
        errorMessage: e?.message || "unknown",
        googleError: e?.response?.data || null,
      },
      { status: 500 }
    )
  }
}

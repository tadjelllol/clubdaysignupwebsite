import { NextRequest, NextResponse } from "next/server"
import { getGoogleClients } from "@/app/lib/google"
export async function POST(req: NextRequest) {
  try {
    const { sheetIds, data } = await req.json()
    if (!Array.isArray(sheetIds) || sheetIds.length === 0) {
      return NextResponse.json({ error: "sheetIds[] required" }, { status: 400 })
    }
    const { sheets } = getGoogleClients()
    const values = [
      [
        data.timestamp,
        data.email,
        data.name,
        data.grade,
        data.photoConsent ? "Yes" : "No",
        data.discord || "Not provided",
      ],
    ]
    const results: Array<{ sheetId: string; ok: boolean; error?: string }> = []
    for (const sid of sheetIds) {
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: sid,
          range: "A:F",
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values },
        })
        results.push({ sheetId: sid, ok: true })
      } catch (e: any) {
        console.error("Append failed for", sid, e?.message)
        results.push({ sheetId: sid, ok: false, error: e?.message || "Unknown error" })
      }
    }
    const okCount = results.filter((r) => r.ok).length
    return NextResponse.json({ ok: okCount, total: results.length, results })
  } catch (err) {
    console.error("submit-registration-multi error:", err)
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 })
  }
}

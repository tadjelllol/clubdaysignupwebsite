import { NextRequest, NextResponse } from "next/server"
import {
  getAcademicYear,
  getGoogleClients,
  ensureConfigSheet,
  upsertConfigRows,
  readConfigForYear,
} from "@/app/lib/google"
export async function POST(req: NextRequest) {
  // Simple gate (optional): require a basic admin password in the body or cookie.
  // For now, assume your admin UI is not public.
  try {
    const body = await req.json()
    const updates = body?.updates
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }
    const { drive, sheets } = getGoogleClients()
    const configId = await ensureConfigSheet(drive, sheets)
    const year = getAcademicYear()
    await upsertConfigRows(sheets, configId, updates, year)
    const rows = await readConfigForYear(sheets, configId, year)
    return NextResponse.json({ academicYear: year, clubs: rows })
  } catch (err: any) {
    console.error("POST /admin/save-config error:", err?.message, err?.response?.data)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}

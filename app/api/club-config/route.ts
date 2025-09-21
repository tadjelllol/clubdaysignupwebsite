import { NextRequest, NextResponse } from "next/server"
import {
  getAcademicYear,
  getGoogleClients,
  ensureConfigSheet,
  readConfigForYear,
  upsertConfigRows,
} from "@/app/lib/google"
function isAuthorized(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET
  const provided = req.headers.get("x-admin-secret")
  return adminSecret && provided && provided === adminSecret
}
export async function GET() {
  try {
    const { drive, sheets } = getGoogleClients()
    const configId = await ensureConfigSheet(drive, sheets)
    const year = getAcademicYear()
    const rows = await readConfigForYear(sheets, configId, year)
    return NextResponse.json({ academicYear: year, clubs: rows })
  } catch (err: any) {
    console.error("GET /club-config error:", {
      message: err?.message,
      data: err?.response?.data,
      stack: err?.stack,
    })
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 })
  }
}
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json()
    const updates: Array<{ clubId: string; clubName: string; sheetId: string }> = body?.updates || []
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
    console.error("POST /club-config error:", {
      message: err?.message,
      data: err?.response?.data,
      stack: err?.stack,
    })
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}

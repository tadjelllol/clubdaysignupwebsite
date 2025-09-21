"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Users,
  Smartphone,
  Laptop,
  Sparkles,
  Film,
  Wrench,
  Settings,
  EyeOff,
  ArrowRight,
  ExternalLink,
  RefreshCcw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const initialClubs = [
  {
    id: "engineering",
    name: "Engineering Club",
    sheetId: "YOUR_ENGINEERING_SHEET_ID",
    icon: Wrench,
    logo: "https://i.imgur.com/sb1cU8G.png",
    description: "Engineering tomorrow, today",
    colors: {
      primary:
        "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25",
      accent: "border-cyan-500/20 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 backdrop-blur-sm",
      text: "text-cyan-400",
      gradient: "from-cyan-400 via-blue-500 to-indigo-600",
      glow: "shadow-cyan-500/50",
    },
  },
  {
    id: "cinema",
    name: "Cinema and Film Produciton Club",
    sheetId: "YOUR_CINEMA_SHEET_ID",
    icon: Film,
    logo: "https://i.imgur.com/tZTR6vZ.png",
    description: "Celebrating the art of film",
    colors: {
      primary:
        "bg-gradient-to-r from-[#7b160f] to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/25",
      accent: "border-[rgb(123,22,16)]/20 bg-gradient-to-r from-red-950/50 to-pink-950/50 backdrop-blur-sm",
      text: "text-red-400",
      gradient: "from-red-400 via-pink-500 to-rose-600",
      glow: "shadow-[#7b160f]/50",
    },
  },
  {
    id: "scholars",
    name: "McRoberts Scholars",
    sheetId: "YOUR_SCHOLARS_SHEET_ID",
    icon: Sparkles,
    logo: "https://i.imgur.com/Otbfkil.png",
    description: "Empowering students with scholarship opportunities",
    colors: {
      primary:
        "bg-gradient-to-r from-emerald-500 via-yellow-400 to-blue-600 hover:from-emerald-600 hover:via-yellow-500 hover:to-blue-700 text-white shadow-lg shadow-emerald-500/25",
      accent:
        "border-emerald-500/20 bg-gradient-to-r from-emerald-950/50 via-yellow-950/50 to-blue-950/50 backdrop-blur-sm",
      text: "text-emerald-400",
      gradient: "from-emerald-400 via-yellow-400 to-blue-500",
      glow: "shadow-emerald-500/50",
    },
  },
]

const grades = ["9", "10", "11", "12"]

const WEBSITE_URL = "https://club-registration-yr9u.onrender.com/"

export default function ClubRegistration() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [clubs, setClubs] = useState(initialClubs)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [selectedClub, setSelectedClub] = useState("")
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    grade: "",
    photoConsent: false,
    discord: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      generateQRCode()
    }
  }, [mounted])

  useEffect(() => {
    if (mounted && !isAdmin) {
      generateQRCode()
    }
  }, [mounted, isAdmin])

  // Load config from API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/club-config", { cache: "no-store" })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setClubs((prev) =>
          prev.map((c) => {
            const match = data.clubs.find((r: any) => r.clubId === c.id)
            return match ? { ...c, sheetId: match.sheetId } : c
          })
        )
      } catch (e) {
        console.error("Failed to load config:", e)
      }
    }
    load()
    // Optional: auto-refresh every 30s so all laptops get updates without reload
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  const handleAdminLogin = () => {
    if (adminPassword === "123") {
      setIsAdmin(true)
      setShowAdminLogin(false)
      toast({
        title: "Admin access granted",
        description: "You can now manage clubs and settings.",
      })
    } else {
      toast({
        title: "Invalid password",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateClubSheetId = (clubId: string, sheetId: string) => {
    setClubs((prev) => prev.map((club) => (club.id === clubId ? { ...club, sheetId } : club)))
  }

  const createAllSheets = async () => {
    try {
      const updatedClubs = [...clubs]
      const results = []

      for (let i = 0; i < updatedClubs.length; i++) {
        const club = updatedClubs[i]
        toast({
          title: `Creating sheet for ${club.name}...`,
          description: "Please wait while we set up your Google Sheet.",
        })

        try {
          const response = await fetch("/api/create-sheet", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ clubName: club.name }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to create sheet for ${club.name}: ${errorText}`)
          }

          const data = await response.json()
          updatedClubs[i] = { ...club, sheetId: data.sheetId }
          results.push(data)
        } catch (error) {
          console.error(`Error creating sheet for ${club.name}:`, error)
          toast({
            title: `Failed to create sheet for ${club.name}`,
            description: "You can manually enter the Sheet ID in the admin panel.",
            variant: "destructive",
          })
        }
      }

      if (results.length > 0) {
        setClubs(updatedClubs)

        const newSheets = results.filter((r) => !r.existing)
        const existingSheets = results.filter((r) => r.existing)

        if (newSheets.length > 0 && existingSheets.length > 0) {
          toast({
            title: "Sheets updated!",
            description: `Created ${newSheets.length} new sheets, ${existingSheets.length} already existed for this academic year.`,
          })
        } else if (newSheets.length > 0) {
          toast({
            title: "All sheets created successfully!",
            description: `Created ${newSheets.length} new sheets for the current academic year.`,
          })
        } else {
          toast({
            title: "Sheets already exist!",
            description: "All sheets for the current academic year already exist.",
          })
        }
      } else {
        toast({
          title: "Unable to create sheets automatically",
          description:
            "Please check your Google API credentials in environment variables, or manually enter Sheet IDs below.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in createAllSheets:", error)
      toast({
        title: "Failed to create sheets",
        description: "Please check your Google API credentials and try again, or manually enter Sheet IDs.",
        variant: "destructive",
      })
    }
  }

  const currentClub = clubs.find((c) => c.id === selectedClub)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClub) {
      toast({
        title: "Please select a club",
        description: "You need to choose which club you're registering for.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const club = clubs.find((c) => c.id === selectedClub)

      if (!club?.sheetId || club.sheetId.startsWith("YOUR_")) {
        toast({
          title: "Sheet not configured",
          description: "Please ask an admin to set up the Google Sheet for this club.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      const timestamp = new Date().toISOString()

      const response = await fetch("/api/submit-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetId: club?.sheetId,
          data: {
            timestamp,
            email: formData.email,
            name: formData.name,
            grade: formData.grade,
            photoConsent: formData.photoConsent ? "Yes" : "No",
            discord: formData.discord || "Not provided",
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to submit registration: ${errorText}`)
      }

      toast({
        title: "Registration successful!",
        description: `Welcome to ${club?.name}! Check your email for more details.`,
      })

      setFormData({
        email: "",
        name: "",
        grade: "",
        photoConsent: false,
        discord: "",
      })
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: "Please try again or register manually with a club officer.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const configured = clubs.filter((c) => c.sheetId && !c.sheetId.startsWith("YOUR_"))
      if (configured.length === 0) {
        toast({ title: "No clubs configured", variant: "destructive" })
        setIsSubmitting(false)
        return
      }
      const timestamp = new Date().toISOString()
      const res = await fetch("/api/submit-registration-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetIds: configured.map((c) => c.sheetId),
          data: {
            timestamp,
            email: formData.email,
            name: formData.name,
            grade: formData.grade,
            photoConsent: formData.photoConsent,
            discord: formData.discord || "Not provided",
          },
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()
      toast({
        title: "Registered for all clubs",
        description: `Submitted ${result.ok}/${result.total} successfully.`,
      })
      // reset form
      setFormData({ email: "", name: "", grade: "", photoConsent: false, discord: "" })
    } catch (err) {
      console.error(err)
      toast({ title: "Batch registration failed", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateQRCode = async () => {
    if (!mounted || !qrCanvasRef.current) return

    try {
      const QRCode = (await import("qrcode")).default
      await QRCode.toCanvas(qrCanvasRef.current, WEBSITE_URL, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
    } catch (error) {
      console.error("Failed to generate QR code:", error)
    }
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        <div className="mx-auto max-w-4xl space-y-8 p-4 relative z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <Button
              onClick={() => setIsAdmin(false)}
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400/50"
            >
              Back to Registration
            </Button>
          </div>

          <Card className="border-cyan-500/20 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm shadow-xl shadow-cyan-500/10">
            <CardHeader>
              <CardTitle className="text-cyan-400">Google Sheets Configuration</CardTitle>
              <CardDescription className="text-slate-300">Set up your Google Sheet IDs for each club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-slate-200">Auto-Create Sheets</h4>
                  <p className="text-sm text-slate-400">Automatically create Google Sheets with proper headers</p>
                </div>
                <Button
                  onClick={createAllSheets}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25"
                >
                  Create All Sheets
                </Button>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h4 className="font-medium text-slate-200 mb-4">Manual Sheet ID Entry</h4>
                {clubs.map((club) => (
                  <div key={club.id} className="space-y-2 mb-4">
                    <Label htmlFor={`${club.id}-sheet`} className="text-slate-300">
                      {club.name} Sheet ID
                    </Label>
                    <Input
                      id={`${club.id}-sheet`}
                      placeholder="Enter Google Sheet ID"
                      value={club.sheetId}
                      onChange={(e) => updateClubSheetId(club.id, e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/club-config", { cache: "no-store" })
                        const data = await res.json()
                        setClubs((prev) =>
                          prev.map((c) => {
                            const m = data.clubs.find((r: any) => r.clubId === c.id)
                            return m ? { ...c, sheetId: m.sheetId } : c
                          })
                        )
                        toast({ title: "Synced", description: "Latest config loaded." })
                      } catch (e) {
                        console.error("Failed to refresh config:", e)
                        toast({ title: "Refresh failed", description: "Check server logs.", variant: "destructive" })
                      }
                    }}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Config
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const updates = clubs.map((c) => ({ clubId: c.id, clubName: c.name, sheetId: c.sheetId }))
                        const res = await fetch("/api/admin/save-config", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            // "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET as string, // Removed for server-side proxy
                          },
                          body: JSON.stringify({ updates }),
                        })
                        if (!res.ok) throw new Error(await res.text())
                        toast({ title: "Saved", description: "Config updated for all laptops." })
                      } catch (e) {
                        console.error("Failed to save config:", e)
                        toast({ title: "Save failed", description: "Check server logs.", variant: "destructive" })
                      }
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    Save Config
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-950/50 to-orange-950/50 p-4 rounded-lg border border-amber-500/20 backdrop-blur-sm">
                <h4 className="font-medium text-amber-300 mb-2">Sheet Names for This Year:</h4>
                <ul className="text-sm text-amber-200 space-y-1">
                  <li>
                    • <strong>Engineering Club Registration 2024/2025</strong>
                  </li>
                  <li>
                    • <strong>Cinema Club Registration 2024/2025</strong>
                  </li>
                  <li>
                    • <strong>McRoberts Scholars Registration 2024/2025</strong>
                  </li>
                </ul>
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <p className="text-xs text-amber-300">
                    <strong>Environment Variables Required:</strong> GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="fixed top-4 right-4 z-50"> {/* Admin Login/Settings */}
        {!showAdminLogin ? (
          <Button
            onClick={() => setShowAdminLogin(true)}
            variant="ghost"
            size="sm"
            className="bg-slate-800/80 backdrop-blur-sm shadow-lg hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-600/50"
          >
            <Settings className="h-4 w-4" />
          </Button>
        ) : (
          <Card className="w-64 shadow-xl bg-slate-800/90 backdrop-blur-sm border-slate-600/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-slate-200">Admin Login</Label>
                <Button
                  onClick={() => setShowAdminLogin(false)}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-200"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
              <Input
                type="password"
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
              />
              <Button onClick={handleAdminLogin} size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700">
                Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mx-auto max-w-6xl space-y-8 p-4 md:pr-[320px] relative z-10"> {/* Added md:pr-[320px] */}
        {/* Main Hero Section with responsive grid */}
        <div className="py-10 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-1 items-center gap-8 md:gap-10"> {/* Changed to 1 column on desktop */}
            {/* Left: Hero text */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-30"></div>
                <div className="relative bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md rounded-3xl p-12 shadow-2xl border border-slate-700/50">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/25">
                      <Users className="h-12 w-12 text-white" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent leading-tight">
                      Club Registration
                    </h1>
                  </div>
                  <p className="text-slate-300 text-2xl font-medium mb-8">Join the excitement of Clubs Day!</p>

                  <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Smartphone className="h-5 w-5 text-green-400" />
                      </div>
                      <span>Scan QR code on mobile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Laptop className="h-5 w-5 text-blue-400" />
                      </div>
                      <span>Or use this laptop</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right: QR panel (removed from here, now a floating component for desktop) */}
          </div>
        </div>

        {/* Club Selection / Registration Form */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Club Cards - Mobile */}
          {isMobile && (
            <div className="grid gap-4 md:grid-cols-3"> {/* Reverted to md:grid-cols-3 */}
              {clubs.map((club) => {
                const Icon = club.icon
                const isSelected = selectedClub === club.id
                return (
                  <Card
                    key={club.id}
                    className={`cursor-pointer transition-all duration-500 hover:scale-105 border-2 ${
                      isSelected
                        ? `ring-2 ring-offset-2 ring-offset-slate-900 ${club.colors.accent} shadow-2xl ${club.colors.glow}`
                        : "border-slate-700/50 hover:border-slate-600/50 hover:shadow-xl"
                    } bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm`}
                    onClick={() => setSelectedClub(club.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <div
                        className={`w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden ${club.id === "cinema" ? "bg-[#7b1610]" : "bg-white"} shadow-lg shadow-slate-900/50`}
                      >
                        <img
                          src={club.logo || "/placeholder.svg"}
                          alt={`${club.name} logo`}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                      <h3 className={`font-bold text-xl mb-2 ${isSelected ? club.colors.text : "text-slate-200"}`}>
                        {club.name}
                      </h3>
                      <p className="text-sm text-slate-400">{club.description}</p>
                      {isSelected && (
                        <div className="mt-3 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                          Selected ✓
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="space-y-6">
            {/* Club Cards - Desktop */}
            {!isMobile && (
              <div className="grid gap-4 md:grid-cols-3"> {/* Reverted to md:grid-cols-3 */}
                {clubs.map((club) => {
                  const Icon = club.icon
                  const isSelected = selectedClub === club.id
                  return (
                    <Card
                      key={club.id}
                      className={`cursor-pointer transition-all duration-500 hover:scale-105 border-2 ${
                        isSelected
                          ? `ring-2 ring-offset-2 ring-offset-slate-900 ${club.colors.accent} shadow-2xl ${club.colors.glow}`
                        : "border-slate-700/50 hover:border-slate-600/50 hover:shadow-xl"
                      } bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm`}
                      onClick={() => setSelectedClub(club.id)}
                    >
                      <CardContent className="p-6 text-center">
                        <div
                          className={`w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden ${club.id === "cinema" ? "bg-[#7b1610]" : "bg-white"} shadow-lg shadow-slate-900/50`}
                        >
                          <img
                            src={club.logo || "/placeholder.svg"}
                            alt={`${club.name} logo`}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                        <h3 className={`font-bold text-xl mb-2 ${isSelected ? club.colors.text : "text-slate-200"}`}>
                          {club.name}
                        </h3>
                        <p className="text-sm text-slate-400">{club.description}</p>
                        {isSelected && (
                          <div className="mt-3 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                            Selected ✓
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {selectedClub && (
              <Card className={`${currentClub?.colors.accent} shadow-2xl ${currentClub?.colors.glow} backdrop-blur-sm`}>
                <CardHeader>
                  <CardTitle className={`text-4xl font-bold ${currentClub?.colors.text} flex items-center gap-3 md:text-5xl`}> {/* Increased font size */}
                    {currentClub && <currentClub.icon className="h-10 w-10 md:h-12 md:w-12" />} {/* Increased icon size */}
                    Registration Details
                  </CardTitle>
                  <CardDescription className="text-xl text-slate-300 md:text-2xl"> {/* Increased font size */}
                    Fill out your information to join {clubs.find((c) => c.id === selectedClub)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-medium text-slate-200">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          placeholder="First and Last Name"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          className="h-12 bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="grade" className="text-base font-medium text-slate-200">
                          Grade *
                        </Label>
                        <Select
                          value={formData.grade}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, grade: value }))}
                          required
                        >
                          <SelectTrigger className="h-12 bg-slate-800/50 border-slate-600 text-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600">
                            {grades.map((grade) => (
                              <SelectItem key={grade} value={grade} className="text-slate-200 hover:bg-slate-700">
                                Grade {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-medium text-slate-200">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@school.edu"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="h-12 bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                          required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discord" className="text-base font-medium text-slate-200">
                        Discord Username (Optional)
                      </Label>
                      <Input
                        id="discord"
                        placeholder="username#1234"
                        value={formData.discord}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discord: e.target.value }))}
                        className="h-12 bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/50 backdrop-blur-sm">
                      <Checkbox
                        id="photo-consent"
                        checked={formData.photoConsent}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, photoConsent: checked as boolean }))
                        }
                        className="border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                      <div className="grid gap-2 leading-none">
                        <Label
                          htmlFor="photo-consent"
                          className="text-base font-medium leading-none text-slate-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Photo Consent
                        </Label>
                        <p className="text-sm text-slate-300">
                          I agree to being photographed during club activities. These photos may be used in the
                          &quot;yearbook&quot; and club media.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                        type="submit"
                        className={`h-16 text-xl font-semibold ${currentClub?.colors.primary || "bg-gradient-to-r from-cyan-600 to-blue-600"} rounded-2xl`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Registering..." : `Join ${currentClub?.name}`}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmitAll}
                        className="h-16 text-xl font-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-2xl"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Registering..." : "Apply to All Clubs"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Desktop QR Code - Fixed and always visible */}
      {!isMobile && (
        <div className="fixed top-4 right-4 z-40 hidden md:block"> {/* Added hidden md:block */}
          <Card className="bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-md shadow-2xl border-slate-700/50 w-80">
            <CardHeader>
              <CardTitle className="text-center text-cyan-400 text-2xl">Mobile Registration</CardTitle>
              <CardDescription className="text-center text-slate-300 text-base">
                Students can scan this QR code to register on their phones
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {mounted ? (
                <div className="flex justify-center">
                  <canvas
                    ref={qrCanvasRef}
                    className="border-2 border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/20"
                    style={{ maxWidth: "256px", maxHeight: "256px" }}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center w-64 h-64 bg-slate-800 border-2 border-slate-600 rounded-xl">
                  <p className="text-slate-400">Loading QR Code...</p>
                </div>
              )}
              <p className="text-sm text-slate-300">Scan with phone camera or visit the URL above</p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>Points to:</span>
                <a
                  href={WEBSITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {WEBSITE_URL}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Smartphone, Laptop, Sparkles, Film, Wrench, Settings, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

const initialClubs = [
  {
    id: "engineering",
    name: "Engineering Club",
    sheetId: "YOUR_ENGINEERING_SHEET_ID",
    icon: Wrench,
    logo: "https://i.imgur.com/sb1cU8G.png",
    description: "Build, innovate, and engineer the future",
    colors: {
      primary: "bg-sky-500 hover:bg-sky-600 text-white",
      accent: "border-sky-200 bg-sky-50",
      text: "text-sky-700",
      gradient: "from-sky-400 to-blue-500",
    },
  },
  {
    id: "cinema",
    name: "Cinema Club",
    sheetId: "YOUR_CINEMA_SHEET_ID",
    icon: Film,
    logo: "https://i.imgur.com/ZQSRaj8.png",
    description: "Lights, camera, action! Create cinematic magic",
    colors: {
      primary: "bg-red-600 hover:bg-red-700 text-white",
      accent: "border-red-200 bg-red-50",
      text: "text-red-700",
      gradient: "from-red-500 to-black",
    },
  },
  {
    id: "scholars",
    name: "McRoberts Scholars",
    sheetId: "YOUR_SCHOLARS_SHEET_ID",
    icon: Sparkles,
    logo: "https://i.imgur.com/Otbfkil.png",
    description: "Excellence in academics and leadership",
    colors: {
      primary: "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white",
      accent: "border-emerald-200 bg-gradient-to-r from-emerald-50 to-blue-50",
      text: "text-emerald-700",
      gradient: "from-emerald-500 via-yellow-400 to-blue-500",
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-800">Admin Panel</h1>
            <Button onClick={() => setIsAdmin(false)} variant="outline">
              Back to Registration
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Google Sheets Configuration</CardTitle>
              <CardDescription>Set up your Google Sheet IDs for each club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-slate-800">Auto-Create Sheets</h4>
                  <p className="text-sm text-slate-600">Automatically create Google Sheets with proper headers</p>
                </div>
                <Button onClick={createAllSheets} className="bg-green-600 hover:bg-green-700">
                  Create All Sheets
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-4">Manual Sheet ID Entry</h4>
                {clubs.map((club) => (
                  <div key={club.id} className="space-y-2 mb-4">
                    <Label htmlFor={`${club.id}-sheet`}>{club.name} Sheet ID</Label>
                    <Input
                      id={`${club.id}-sheet`}
                      placeholder="Enter Google Sheet ID"
                      value={club.sheetId}
                      onChange={(e) => updateClubSheetId(club.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">Sheet Names for This Year:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
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
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-xs text-amber-600">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="fixed top-4 right-4 z-50">
          {!showAdminLogin ? (
            <Button
              onClick={() => setShowAdminLogin(true)}
              variant="ghost"
              size="sm"
              className="bg-white/80 backdrop-blur-sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
          ) : (
            <Card className="w-64">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Admin Login</Label>
                  <Button onClick={() => setShowAdminLogin(false)} variant="ghost" size="sm">
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                />
                <Button onClick={handleAdminLogin} size="sm" className="w-full">
                  Login
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 rounded-2xl blur-xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl p-8 shadow-lg border">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Users className="h-10 w-10 text-blue-600" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Club Registration
                </h1>
              </div>
              <p className="text-slate-600 text-xl font-medium">Join the excitement of Clubs Day!</p>

              <div className="flex items-center justify-center gap-8 mt-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  <span>Scan QR code on mobile</span>
                </div>
                <div className="flex items-center gap-2">
                  <Laptop className="h-5 w-5 text-blue-500" />
                  <span>Or use this laptop</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isMobile && (
          <div className="grid gap-4 md:grid-cols-3">
            {clubs.map((club) => {
              const Icon = club.icon
              const isSelected = selectedClub === club.id
              return (
                <Card
                  key={club.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    isSelected ? `ring-2 ring-offset-2 ${club.colors.accent} shadow-lg` : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedClub(club.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-white shadow-md">
                      <Image
                        src={club.logo || "/placeholder.svg"}
                        alt={`${club.name} logo`}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h3 className={`font-bold text-lg mb-2 ${isSelected ? club.colors.text : "text-slate-700"}`}>
                      {club.name}
                    </h3>
                    <p className="text-sm text-slate-500">{club.description}</p>
                    {isSelected && (
                      <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Selected ✓
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className={`grid gap-8 ${!isMobile ? "lg:grid-cols-2" : ""}`}>
          {/* Registration Section */}
          <div className="space-y-6">
            {!isMobile && (
              <div className="grid gap-4 md:grid-cols-3">
                {clubs.map((club) => {
                  const Icon = club.icon
                  const isSelected = selectedClub === club.id
                  return (
                    <Card
                      key={club.id}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                        isSelected ? `ring-2 ring-offset-2 ${club.colors.accent} shadow-lg` : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedClub(club.id)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-white shadow-md">
                          <Image
                            src={club.logo || "/placeholder.svg"}
                            alt={`${club.name} logo`}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h3 className={`font-bold text-lg mb-2 ${isSelected ? club.colors.text : "text-slate-700"}`}>
                          {club.name}
                        </h3>
                        <p className="text-sm text-slate-500">{club.description}</p>
                        {isSelected && (
                          <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
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
              <Card className={`${currentClub?.colors.accent} shadow-lg`}>
                <CardHeader>
                  <CardTitle className={`text-2xl ${currentClub?.colors.text} flex items-center gap-2`}>
                    {currentClub && <currentClub.icon className="h-6 w-6" />}
                    Registration Details
                  </CardTitle>
                  <CardDescription className="text-base">
                    Fill out your information to join {clubs.find((c) => c.id === selectedClub)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-base font-medium">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          placeholder="First and Last Name"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                          className="h-12"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="grade" className="text-base font-medium">
                          Grade *
                        </Label>
                        <Select
                          value={formData.grade}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, grade: value }))}
                          required
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {grades.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                Grade {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-medium">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@school.edu"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="h-12"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discord" className="text-base font-medium">
                        Discord Username (Optional)
                      </Label>
                      <Input
                        id="discord"
                        placeholder="username#1234"
                        value={formData.discord}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discord: e.target.value }))}
                        className="h-12"
                      />
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border">
                      <Checkbox
                        id="photo-consent"
                        checked={formData.photoConsent}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, photoConsent: checked as boolean }))
                        }
                      />
                      <div className="grid gap-2 leading-none">
                        <Label
                          htmlFor="photo-consent"
                          className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Photo Consent
                        </Label>
                        <p className="text-sm text-slate-600">
                          I agree to being photographed during club activities. These photos may be used in the
                          &quot;yearbook&quot; and club media.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className={`w-full h-14 text-lg font-semibold ${currentClub?.colors.primary || "bg-primary hover:bg-primary/90"}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Registering..." : `Join ${currentClub?.name} Now!`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {!isMobile && (
            <div className="space-y-6">
              <Card className="bg-white shadow-lg sticky top-4">
                <CardHeader>
                  <CardTitle className="text-center text-blue-700">Mobile Registration</CardTitle>
                  <CardDescription className="text-center">
                    Students can scan this QR code to register on their phones
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {mounted ? (
                    <div className="flex justify-center">
                      <canvas
                        ref={qrCanvasRef}
                        className="border-2 border-slate-200 rounded-lg"
                        style={{ maxWidth: "256px", maxHeight: "256px" }}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center items-center w-64 h-64 bg-gray-100 border-2 border-gray-200 rounded-lg">
                      <p className="text-gray-500">Loading QR Code...</p>
                    </div>
                  )}
                  <p className="text-sm text-slate-600">Scan with phone camera or visit the URL above</p>
                  <p className="text-xs text-slate-500">Points to: {WEBSITE_URL}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {isMobile && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-blue-700">For Laptop Users</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {mounted ? (
                <div className="flex justify-center">
                  <canvas
                    ref={qrCanvasRef}
                    className="border-2 border-slate-200 rounded-lg"
                    style={{ maxWidth: "192px", maxHeight: "192px" }}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center w-48 h-48 bg-gray-100 border-2 border-gray-200 rounded-lg">
                  <p className="text-gray-500">Loading QR Code...</p>
                </div>
              )}
              <p className="text-sm text-slate-600">Show this to students without phones</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

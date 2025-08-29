"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Plus, Trash2 } from "lucide-react"

interface Club {
  id: string
  name: string
  sheetId: string
}

export default function ClubAdmin() {
  const [clubs, setClubs] = useState<Club[]>([
    { id: "robotics", name: "Robotics Club", sheetId: "1ABC123_robotics" },
    { id: "debate", name: "Debate Team", sheetId: "1DEF456_debate" },
    { id: "drama", name: "Drama Club", sheetId: "1GHI789_drama" },
    { id: "chess", name: "Chess Club", sheetId: "1JKL012_chess" },
  ])

  const [newClub, setNewClub] = useState({ name: "", sheetId: "" })

  const addClub = () => {
    if (newClub.name && newClub.sheetId) {
      const id = newClub.name.toLowerCase().replace(/\s+/g, "-")
      setClubs((prev) => [...prev, { id, ...newClub }])
      setNewClub({ name: "", sheetId: "" })
    }
  }

  const removeClub = (id: string) => {
    setClubs((prev) => prev.filter((club) => club.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Club Management</h1>
      </div>

      {/* Add New Club */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Club</CardTitle>
          <CardDescription>Add a new club with its corresponding Google Sheets ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="club-name">Club Name</Label>
              <Input
                id="club-name"
                placeholder="e.g., Photography Club"
                value={newClub.name}
                onChange={(e) => setNewClub((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet-id">Google Sheets ID</Label>
              <Input
                id="sheet-id"
                placeholder="e.g., 1ABC123_photography"
                value={newClub.sheetId}
                onChange={(e) => setNewClub((prev) => ({ ...prev, sheetId: e.target.value }))}
              />
            </div>
          </div>
          <Button onClick={addClub} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Club
          </Button>
        </CardContent>
      </Card>

      {/* Existing Clubs */}
      <Card>
        <CardHeader>
          <CardTitle>Current Clubs</CardTitle>
          <CardDescription>Manage your existing clubs and their Google Sheets connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clubs.map((club) => (
              <div key={club.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">{club.name}</h3>
                  <p className="text-sm text-muted-foreground">Sheet ID: {club.sheetId}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeClub(club.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

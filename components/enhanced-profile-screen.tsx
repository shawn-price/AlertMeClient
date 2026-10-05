"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Camera, Edit, Save, X } from "@/components/ui/iconify-compat"
import { dataStore, type UserData } from "@/lib/data-store"
import { formatCurrency } from "@/lib/form-utils"

interface EnhancedProfileScreenProps {
  onBack: () => void
}

export function EnhancedProfileScreen({ onBack }: EnhancedProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState<UserData>(dataStore.getUserData())
  const [editedProfile, setEditedProfile] = useState<UserData>(profile)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load profile picture from persistent storage on mount
    dataStore.loadProfilePicture().then(() => {
      const updatedProfile = dataStore.getUserData()
      setProfile(updatedProfile)
      if (!isEditing) {
        setEditedProfile(updatedProfile)
      }
    })

    const unsubscribe = dataStore.subscribe(() => {
      const updatedProfile = dataStore.getUserData()
      setProfile(updatedProfile)
      if (!isEditing) {
        setEditedProfile(updatedProfile)
      }
    })

    return unsubscribe
  }, [isEditing])

  const handleSave = () => {
    dataStore.updateUserData(editedProfile)
    setProfile(editedProfile)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      
      // Convert file to base64 for persistent storage
      // Using FileReader.readAsDataURL() creates a data URL that persists across sessions
      // Unlike URL.createObjectURL() which creates a temporary blob URL
      const reader = new FileReader()
      
      reader.onloadend = () => {
        const base64String = reader.result as string
        
        // Update the profile picture with the persistent base64 string
        dataStore.updateProfilePicture(base64String)

        // Also update the edited profile if in editing mode
        if (isEditing) {
          setEditedProfile((prev) => ({ ...prev, profilePicture: base64String }))
        }
        
        setIsUploading(false)
      }
      
      reader.onerror = () => {
        console.error("[ProfileScreen] Failed to read image file")
        setIsUploading(false)
      }
      
      reader.readAsDataURL(file)
    }
  }

  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b shadow-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">User Profile</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <X className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
        </Button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Profile Picture Section */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden bg-gradient-to-r from-primary to-primary/80">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">{profile.name.charAt(0)}</span>
                )}
              </div>
              <Button
                size="icon"
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={triggerImageUpload}
                disabled={isUploading}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            <div className="font-semibold text-lg">{profile.name}</div>
            <Badge
              className={`mt-2 ${profile.status === "Active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
            >
              {profile.status}
            </Badge>
            {isUploading && (
              <div className="mt-2 text-sm text-muted-foreground">Uploading image...</div>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Account Number</Label>
                <div className="font-medium">{profile.accountNumber}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Current Balance</Label>
                <div className="font-medium text-primary">₦ {formatCurrency(profile.balance)}</div>
              </div>
            </div>
            <div>
              <Label htmlFor="bvn" className="text-sm text-muted-foreground">BVN</Label>
              {isEditing ? (
                <Input
                  id="bvn"
                  value={editedProfile.bvn}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bvn: e.target.value })}
                  placeholder="Enter BVN"
                />
              ) : (
                <div className="font-medium">{profile.bvn}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                />
              ) : (
                <div className="font-medium">{profile.name}</div>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                />
              ) : (
                <div className="font-medium">{profile.email}</div>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                />
              ) : (
                <div className="font-medium">{profile.phone}</div>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={editedProfile.address}
                  onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                />
              ) : (
                <div className="font-medium">{profile.address}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              Change Transaction PIN
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              Enable Biometric Login
            </Button>
          </CardContent>
        </Card>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

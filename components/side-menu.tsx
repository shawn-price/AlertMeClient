"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { dataStore } from "@/lib/data-store"
import { StorageManager } from "@/lib/storage-manager"
import {
  Building2,
  Send,
  ArrowDownToLine,
  Receipt,
  CreditCard,
  Smartphone,
  MoreHorizontal,
  User,
  Settings,
} from "@/components/ui/iconify-compat"

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (screen: string) => void
}

export function SideMenu({ isOpen, onClose, onNavigate }: SideMenuProps) {
  const [userData, setUserData] = useState(dataStore.getUserData())
  const [profilePicture, setProfilePicture] = useState<string | undefined>(userData.profilePicture)

  // Subscribe to data store changes
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      const updatedData = dataStore.getUserData()
      setUserData(updatedData)
      setProfilePicture(updatedData.profilePicture)
    })

    return unsubscribe
  }, [])

  // Load profile picture from IndexedDB if available
  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        const idbPicture = await StorageManager.load<string>("ecobank_profile_picture", "")
        if (idbPicture && !profilePicture) {
          setProfilePicture(idbPicture)
        }
      } catch (error) {
        console.warn("[v0] Failed to load profile picture from IndexedDB:", error)
      }
    }

    if (!profilePicture) {
      loadProfilePicture()
    }
  }, [profilePicture])

  const menuItems = [
    { icon: Building2, label: "Account", screen: "dashboard" },
    { icon: Send, label: "Send Money", screen: "transfer-options", hasDropdown: true },
    { icon: ArrowDownToLine, label: "Add Money", screen: "add-money" },
    { icon: Receipt, label: "Pay Bills", screen: "pay-bills" },
    { icon: CreditCard, label: "Quick Loan", screen: "loans" },
    { icon: Smartphone, label: "Airtime and Data", screen: "pay-bills" },
    { icon: MoreHorizontal, label: "Virtual Cards", screen: "virtual-cards" },
    { icon: User, label: "Profile", screen: "profile" },
    { icon: Settings, label: "Settings", screen: "settings" },
  ]

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="bg-card h-full">
          {/* Profile Section */}
          <div className="p-6 border-b">
            <div
              className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-card"
                  onClick={() => {
                    onNavigate("beneficiary-management")
                    onClose()
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xl font-bold">{userData.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    onNavigate("beneficiary-management")
                    onClose()
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <h3 className="font-semibold text-lg text-foreground truncate">{userData.name.toUpperCase()}</h3>
                  <p className="text-sm text-muted-foreground truncate">{userData.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onNavigate("profile")
                    onClose()
                  }}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-4">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-6 py-4 h-auto text-left"
                  onClick={() => {
                    onNavigate(item.screen)
                    onClose()
                  }}
                >
                  <IconComponent className="h-5 w-5 mr-4 text-primary" />
                  <span className="text-base">{item.label}</span>
                  {item.hasDropdown && <span className="ml-auto text-muted-foreground">▼</span>}
                </Button>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

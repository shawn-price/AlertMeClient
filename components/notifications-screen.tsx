"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, Check, Trash2 } from "@/components/ui/iconify-compat"
import { dataStore, type Notification } from "@/lib/data-store"

interface NotificationsScreenProps {
  onBack: () => void
}

export function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const updateNotifications = () => {
      setNotifications(dataStore.getNotifications())
    }

    updateNotifications()
    const unsubscribe = dataStore.subscribe(updateNotifications)
    return unsubscribe
  }, [])

  const handleMarkAsRead = (id: string) => {
    dataStore.markNotificationAsRead(id)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✅"
      case "info":
        return "ℹ️"
      case "warning":
        return "⚠️"
      case "error":
        return "❌"
      default:
        return "📱"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-l-green-500"
      case "info":
        return "border-l-blue-500"
      case "warning":
        return "border-l-yellow-500"
      case "error":
        return "border-l-red-500"
      default:
        return "border-l-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-muted/50 pb-24">
      {/* Header */}
      <div className="bg-card px-4 py-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Notifications</h1>
        <Bell className="h-5 w-5 text-primary" />
      </div>

      <div className="px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Notifications</h3>
            <p className="text-muted-foreground">You're all caught up! Notifications will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? "bg-blue-50" : "bg-card"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.read && <Badge className="bg-primary text-white text-xs">New</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(notification.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

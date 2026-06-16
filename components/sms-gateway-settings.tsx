"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GatewayConfig,
  GatewayName,
  GATEWAY_PROVIDERS,
} from "@/lib/sms-gateways/types"
import { useToast } from "@/hooks/use-toast"
import { useAlertToast } from "./alert-toast-provider"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Loader2, Save } from "@/components/ui/iconify-compat"

// Use alternative icons for missing lucide icons
const ExternalLink = () => <span>↗</span>
const TestTube = () => <span>🧪</span>
import { dataStore } from "@/lib/data-store"

interface GatewayFormData {
  [key: string]: string | boolean | number
}

export function SMSGatewaySettings() {
  const [configs, setConfigs] = useState<GatewayConfig[]>([])
  const [selectedGateway, setSelectedGateway] = useState<GatewayName | null>(null)
  const [formData, setFormData] = useState<GatewayFormData>({})
  const [testPhoneNumber, setTestPhoneNumber] = useState("")
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingConfigs, setLoadingConfigs] = useState(true)
  const { toast } = useToast()
  const { showAlertToast, updateAlertToast } = useAlertToast()

  // Load gateway configurations on mount
  useEffect(() => {
    const savedConfigs = dataStore.getSMSGatewayConfigs?.()
    if (savedConfigs) {
      setConfigs(savedConfigs)
      if (savedConfigs.length > 0) {
        setSelectedGateway(savedConfigs[0].name)
      }
    }
    setLoadingConfigs(false)
  }, [])

  // Update form data when selected gateway changes
  useEffect(() => {
    if (selectedGateway) {
      const config = configs.find((c) => c.name === selectedGateway)
      if (config) {
        setFormData({
          enabled: config.enabled,
          priority: config.priority,
          ...config.credentials,
        })
      }
    }
  }, [selectedGateway, configs])

  const handleInputChange = (key: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveConfig = async () => {
    if (!selectedGateway) return

    setSaving(true)
    const toastId = showAlertToast({
      type: "pending",
      title: "Saving configuration...",
      description: `Updating ${GATEWAY_PROVIDERS[selectedGateway].displayName} settings`,
      dismissible: false,
    })

    try {
      const updatedConfigs = configs.map((c) => {
        if (c.name === selectedGateway) {
          const { enabled, priority, ...credentials } = formData
          return {
            ...c,
            enabled: enabled as boolean,
            priority: priority as number,
            credentials: credentials as Record<string, string>,
          }
        }
        return c
      })

      // Save to data store
      if (dataStore.setSMSGatewayConfigs) {
        dataStore.setSMSGatewayConfigs(updatedConfigs)
      }

      setConfigs(updatedConfigs)

      updateAlertToast(toastId, {
        type: "success",
        title: "Configuration saved",
        description: `${GATEWAY_PROVIDERS[selectedGateway].displayName} settings updated successfully`,
        duration: 4000,
      })
    } catch (error) {
      updateAlertToast(toastId, {
        type: "failed",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save configuration",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestGateway = async () => {
    if (!selectedGateway || !testPhoneNumber) {
      toast({
        title: "Invalid input",
        description: "Please enter a phone number",
        variant: "destructive",
      })
      return
    }

    setTesting(true)
    const toastId = showAlertToast({
      type: "pending",
      title: "Testing gateway...",
      description: `Sending test SMS via ${GATEWAY_PROVIDERS[selectedGateway].displayName}`,
      dismissible: false,
    })

    try {
      const response = await fetch("/api/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: selectedGateway,
          phoneNumber: testPhoneNumber,
        }),
      })

      const data = await response.json()

      if (data.success) {
        updateAlertToast(toastId, {
          type: "success",
          title: "Test successful",
          description: `Test SMS sent successfully to ${testPhoneNumber}`,
          duration: 4000,
        })
      } else {
        updateAlertToast(toastId, {
          type: "failed",
          title: "Test failed",
          description: data.error || "Failed to send test SMS",
        })
      }
    } catch (error) {
      updateAlertToast(toastId, {
        type: "failed",
        title: "Test error",
        description: error instanceof Error ? error.message : "Error testing gateway",
      })
    } finally {
      setTesting(false)
    }
  }

  if (loadingConfigs) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle>SMS Gateway Configuration</CardTitle>
        <CardDescription>Manage SMS gateways and automatic fallback settings</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gateway selection tabs */}
        <Tabs
          value={selectedGateway || ""}
          onValueChange={(value) => setSelectedGateway(value as GatewayName)}
        >
          <TabsList className="grid w-full grid-cols-4">
            {Object.entries(GATEWAY_PROVIDERS).map(([name, provider]) => (
              <TabsTrigger key={name} value={name} className="text-xs">
                {provider.displayName}
              </TabsTrigger>
            ))}
          </TabsList>

          {selectedGateway &&
            Object.entries(GATEWAY_PROVIDERS).map(([name, provider]) => (
              <TabsContent key={name} value={name} className="space-y-6 mt-6">
                {/* Gateway header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{provider.displayName}</h3>
                    <p className="text-sm text-gray-600 mt-1">Configure {provider.displayName} API credentials</p>
                  </div>

                  {/* Quick links */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(provider.loginUrl, "_blank")}
                      className="text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Login
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(provider.signupUrl, "_blank")}
                      className="text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Sign Up
                    </Button>
                  </div>
                </div>

                {/* Enable/Disable toggle */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div>
                    <Label className="text-sm font-medium">Enable {provider.displayName}</Label>
                    <p className="text-xs text-gray-600 mt-1">
                      {formData.enabled ? "This gateway is active" : "This gateway is disabled"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.enabled as boolean}
                    onCheckedChange={(value) => handleInputChange("enabled", value)}
                  />
                </div>

                {/* Priority setting */}
                <div className="space-y-2">
                  <Label htmlFor={`priority-${name}`}>Priority (Lower = Higher Priority)</Label>
                  <Input
                    id={`priority-${name}`}
                    type="number"
                    min="1"
                    max="4"
                    value={formData.priority || 1}
                    onChange={(e) => handleInputChange("priority", parseInt(e.target.value))}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-600">
                    When sending SMS, gateways are tried in priority order (1 = first attempt)
                  </p>
                </div>

                {/* Credentials form */}
                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-medium">API Credentials</h4>

                  {provider.credentialsRequired.map((credName) => (
                    <div key={credName} className="space-y-2">
                      <Label htmlFor={`cred-${name}-${credName}`} className="capitalize">
                        {credName.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                      <Input
                        id={`cred-${name}-${credName}`}
                        type={credName.includes("key") || credName.includes("secret") ? "password" : "text"}
                        placeholder={`Enter ${credName}`}
                        value={(formData[credName] as string) || ""}
                        onChange={(e) => handleInputChange(credName, e.target.value)}
                      />
                    </div>
                  ))}

                  {/* Documentation link */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(provider.documentationUrl, "_blank")}
                    className="w-full text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View API Documentation
                  </Button>
                </div>

                {/* Test gateway section */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-medium">Test Gateway</h4>
                  <div className="space-y-2">
                    <Label htmlFor={`test-phone-${name}`}>Test Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`test-phone-${name}`}
                        type="tel"
                        placeholder="Enter phone number (e.g., +234..."
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        disabled={testing || !formData.enabled}
                      />
                      <Button
                        onClick={handleTestGateway}
                        disabled={testing || !formData.enabled}
                        size="sm"
                      >
                        {testing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">
                      Send a test SMS to verify your credentials are working correctly
                    </p>
                  </div>
                </div>

                {/* Save button */}
                <div className="border-t pt-6 flex justify-end">
                  <Button onClick={handleSaveConfig} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            ))}
        </Tabs>

        {/* Gateway priority overview */}
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-medium">Active Gateways (Priority Order)</h4>
          <div className="space-y-2">
            {configs
              .filter((c) => c.enabled)
              .sort((a, b) => a.priority - b.priority)
              .map((config, index) => (
                <div
                  key={config.name}
                  className="flex items-center justify-between p-3 border rounded bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{GATEWAY_PROVIDERS[config.name].displayName}</span>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              ))}

            {configs.filter((c) => c.enabled).length === 0 && (
              <div className="flex items-center gap-2 p-3 border border-yellow-200 rounded bg-yellow-50">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">No SMS gateways enabled. Enable at least one gateway above.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

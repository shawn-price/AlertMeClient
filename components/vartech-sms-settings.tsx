"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAlertToast } from "./alert-toast-provider"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Loader2, Save } from "@/components/ui/iconify-compat"

const ExternalLink = () => <span>↗</span>
const TestTube = () => <span>🧪</span>

export function VartechSMSSettings() {
  const [enabled, setEnabled] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("https://sms.thevartech.com/api")
  const [senderId, setSenderId] = useState("AlertMe")

  // Advanced settings
  const [timeout, setTimeout] = useState("30000")
  const [retryAttempts, setRetryAttempts] = useState("3")
  const [retryDelayMs, setRetryDelayMs] = useState("1000")

  const [testPhoneNumber, setTestPhoneNumber] = useState("")
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const { toast } = useToast()
  const { showAlertToast, updateAlertToast } = useAlertToast()

  // Load settings from environment on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings/vartech-config")
        if (response.ok) {
          const data = await response.json()
          setEnabled(data.enabled ?? true)
          setApiKey(data.apiKey || "")
          setBaseUrl(data.baseUrl || "https://sms.thevartech.com/api")
          setSenderId(data.senderId || "AlertMe")
          setTimeout(String(data.timeout || 30000))
          setRetryAttempts(String(data.retryAttempts || 3))
          setRetryDelayMs(String(data.retryDelayMs || 1000))
        }
      } catch (error) {
        console.error("Failed to load VarTech settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSaveConfig = async () => {
    setSaving(true)
    const toastId = showAlertToast({
      type: "pending",
      title: "Saving VarTech configuration...",
      description: "Updating SMS gateway settings",
      dismissible: false,
    })

    try {
      const response = await fetch("/api/settings/vartech-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          apiKey,
          baseUrl,
          senderId,
          timeout: parseInt(timeout),
          retryAttempts: parseInt(retryAttempts),
          retryDelayMs: parseInt(retryDelayMs),
        }),
      })

      if (response.ok) {
        updateAlertToast(toastId, {
          type: "success",
          title: "Configuration saved",
          description: "VarTech SMS settings updated successfully",
          duration: 4000,
        })
      } else {
        const error = await response.json()
        updateAlertToast(toastId, {
          type: "failed",
          title: "Save failed",
          description: error.message || "Failed to save configuration",
        })
      }
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
    if (!testPhoneNumber) {
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
      title: "Testing VarTech gateway...",
      description: `Sending test SMS to ${testPhoneNumber}`,
      dismissible: false,
    })

    try {
      const response = await fetch("/api/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        console.log("Message ID:", data.messageId)
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

  if (loading) {
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
        <CardTitle>VarTech SMS Gateway</CardTitle>
        <CardDescription>Configure and manage VarTech SMS service settings</CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Main Configuration */}
        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6 mt-6">
            {/* Enable/Disable toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div>
                <Label className="text-sm font-medium">Enable VarTech SMS Gateway</Label>
                <p className="text-xs text-gray-600 mt-1">
                  {enabled ? "This gateway is active" : "This gateway is disabled"}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your VarTech API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                Your VarTech API authentication key (keep this secret)
              </p>
            </div>

            {/* Base URL */}
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL</Label>
              <Input
                id="base-url"
                type="url"
                placeholder="https://sms.thevartech.com/api"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                VarTech API endpoint URL (usually pre-configured)
              </p>
            </div>

            {/* Sender ID */}
            <div className="space-y-2">
              <Label htmlFor="sender-id">Sender ID</Label>
              <Input
                id="sender-id"
                type="text"
                placeholder="AlertMe"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                The name that appears as the sender in SMS messages (max 11 characters)
              </p>
            </div>

            {/* Documentation Link */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://sms.thevartech.com/api-doc", "_blank")}
              className="w-full text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View VarTech API Documentation
            </Button>
          </TabsContent>

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-6 mt-6">
            <div className="p-3 border rounded-lg bg-blue-50">
              <p className="text-xs text-blue-800">
                These settings control how the gateway handles requests and retries for reliability.
              </p>
            </div>

            {/* Timeout */}
            <div className="space-y-2">
              <Label htmlFor="timeout">Request Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                min="5000"
                max="60000"
                step="1000"
                value={timeout}
                onChange={(e) => setTimeout(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                Maximum time (in milliseconds) to wait for a response from VarTech API
              </p>
            </div>

            {/* Retry Attempts */}
            <div className="space-y-2">
              <Label htmlFor="retry-attempts">Retry Attempts</Label>
              <Input
                id="retry-attempts"
                type="number"
                min="1"
                max="10"
                value={retryAttempts}
                onChange={(e) => setRetryAttempts(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                Number of times to retry failed requests (useful for handling temporary failures)
              </p>
            </div>

            {/* Retry Delay */}
            <div className="space-y-2">
              <Label htmlFor="retry-delay">Retry Delay (ms)</Label>
              <Input
                id="retry-delay"
                type="number"
                min="100"
                max="10000"
                step="100"
                value={retryDelayMs}
                onChange={(e) => setRetryDelayMs(e.target.value)}
              />
              <p className="text-xs text-gray-600">
                Wait time (in milliseconds) before retrying a failed request (increases exponentially)
              </p>
            </div>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="font-medium">Test VarTech Gateway</h4>
              <p className="text-sm text-gray-600">
                Send a test SMS to verify your VarTech configuration is working correctly.
              </p>

              <div className="space-y-2">
                <Label htmlFor="test-phone">Test Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="test-phone"
                    type="tel"
                    placeholder="e.g., +234801234567 or 08012345678"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    disabled={testing || !enabled || !apiKey}
                  />
                  <Button
                    onClick={handleTestGateway}
                    disabled={testing || !enabled || !apiKey}
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
                  Enter a mobile phone number to send a test SMS message
                </p>
              </div>

              {!enabled && (
                <div className="flex items-center gap-2 p-3 border border-yellow-200 rounded bg-yellow-50">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">VarTech gateway is disabled. Enable it above to test.</p>
                </div>
              )}

              {enabled && !apiKey && (
                <div className="flex items-center gap-2 p-3 border border-red-200 rounded bg-red-50">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">API key is required to test the gateway.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Status and Save */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center gap-2">
            {enabled ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">VarTech SMS is enabled and ready to use</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">VarTech SMS is disabled</span>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setApiKey("")
                setBaseUrl("https://sms.thevartech.com/api")
                setSenderId("AlertMe")
                setTimeout("30000")
                setRetryAttempts("3")
                setRetryDelayMs("1000")
              }}
            >
              Reset
            </Button>
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
        </div>
      </CardContent>
    </Card>
  )
}

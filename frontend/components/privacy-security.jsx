"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Lock,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Key,
  Fingerprint,
  Globe,
  Server,
  Activity,
  Bell,
  Settings,
  Trash2,
  RefreshCw,
} from "lucide-react"

export default function PrivacySecurityCenter({ userType, currentUser }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("30")
  const [dataRetention, setDataRetention] = useState("5years")

  // Mock audit trail data
  const auditTrail = [
    {
      id: 1,
      action: "Data accessed by Dr. Sarah Wilson",
      resource: "Lab Results - Blood Glucose",
      timestamp: "2024-01-15 10:30:00",
      ipAddress: "192.168.1.100",
      location: "Medical Center, Room 205",
      status: "authorized",
      riskLevel: "low",
    },
    {
      id: 2,
      action: "Message sent to patient",
      resource: "Secure Message Thread",
      timestamp: "2024-01-15 09:45:00",
      ipAddress: "192.168.1.101",
      location: "Medical Center, Room 205",
      status: "authorized",
      riskLevel: "low",
    },
    {
      id: 3,
      action: "Privacy settings updated",
      resource: "Patient Consent Preferences",
      timestamp: "2024-01-14 16:20:00",
      ipAddress: "10.0.0.50",
      location: "Home Network",
      status: "authorized",
      riskLevel: "low",
    },
    {
      id: 4,
      action: "Failed login attempt",
      resource: "Authentication System",
      timestamp: "2024-01-14 08:15:00",
      ipAddress: "203.0.113.45",
      location: "Unknown Location",
      status: "blocked",
      riskLevel: "high",
    },
  ]

  // Mock data access log
  const dataAccessLog = [
    {
      id: 1,
      accessor: "Dr. Sarah Wilson",
      accessorRole: "Primary Care Physician",
      dataType: "Lab Results",
      purpose: "Treatment Review",
      timestamp: "2024-01-15 10:30:00",
      duration: "5 minutes",
      authorized: true,
    },
    {
      id: 2,
      accessor: "Dr. Michael Chen",
      accessorRole: "Cardiologist",
      dataType: "Blood Pressure Logs",
      purpose: "Specialist Consultation",
      timestamp: "2024-01-14 14:15:00",
      duration: "12 minutes",
      authorized: true,
    },
    {
      id: 3,
      accessor: "Pharmacy Tech",
      accessorRole: "Medication Verification",
      dataType: "Prescription History",
      purpose: "Drug Interaction Check",
      timestamp: "2024-01-13 11:20:00",
      duration: "3 minutes",
      authorized: true,
    },
  ]

  // Mock security alerts
  const securityAlerts = [
    {
      id: 1,
      type: "suspicious_access",
      title: "Unusual Login Location Detected",
      description: "Login attempt from new location: San Francisco, CA",
      timestamp: "2024-01-15 08:30:00",
      severity: "medium",
      resolved: false,
    },
    {
      id: 2,
      type: "data_export",
      title: "Data Export Requested",
      description: "Patient requested full data export for personal records",
      timestamp: "2024-01-14 15:45:00",
      severity: "low",
      resolved: true,
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "authorized":
        return "default"
      case "blocked":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "default"
      default:
        return "outline"
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }
  return <div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Privacy & Security Center</h2>
          <p className="text-gray-600">Manage your data privacy and security settings</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="h-4 w-4 text-[#b2e061]" />
          <span>HIPAA Compliant</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="access">Data Access</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Security Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Encryption Status</CardTitle>
                <Lock className="h-4 w-4 text-[#b2e061]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#b2e061]">Active</div>
                <p className="text-xs text-muted-foreground">AES-256 End-to-End</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Access Requests</CardTitle>
                <Eye className="h-4 w-4 text-[#7eb0d5]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataAccessLog.length}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                <Shield className="h-4 w-4 text-[#FFDF00]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95/100</div>
                <p className="text-xs text-muted-foreground">Excellent security</p>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Privacy Controls
              </CardTitle>
              <CardDescription>Manage your data sharing and privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Data Sharing</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow authorized healthcare providers to access your data
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Research Participation</Label>
                      <p className="text-sm text-muted-foreground">Allow anonymized data for medical research</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Marketing Communications</Label>
                      <p className="text-sm text-muted-foreground">Receive health-related marketing materials</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base">Data Retention Period</Label>
                    <p className="text-sm text-muted-foreground mb-2">How long should we keep your data?</p>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={dataRetention}
                      onChange={(e) => setDataRetention(e.target.value)}
                    >
                      <option value="1year">1 Year</option>
                      <option value="3years">3 Years</option>
                      <option value="5years">5 Years</option>
                      <option value="10years">10 Years</option>
                      <option value="indefinite">Indefinite</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-base">Session Timeout</Label>
                    <p className="text-sm text-muted-foreground mb-2">Auto-logout after inactivity</p>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Encryption Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Encryption & Security
              </CardTitle>
              <CardDescription>Your data protection details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Data at Rest</p>
                      <p className="text-sm text-gray-600">AES-256 encryption</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Data in Transit</p>
                      <p className="text-sm text-gray-600">TLS 1.3 encryption</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Access Control</p>
                      <p className="text-sm text-gray-600">Role-based permissions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Audit Logging</p>
                      <p className="text-sm text-gray-600">Complete activity tracking</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">System Audit Trail</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Log
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {auditTrail.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {entry.status === "authorized" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{entry.action}</p>
                        <p className="text-sm text-gray-600">{entry.resource}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>{entry.timestamp}</span>
                          <span>IP: {entry.ipAddress}</span>
                          <span>{entry.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(entry.status)}>{entry.status}</Badge>
                      <Badge variant={getRiskColor(entry.riskLevel)}>{entry.riskLevel} risk</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Data Access Tab */}
        <TabsContent value="access" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Data Access Log</h3>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All Access
            </Button>
          </div>

          <div className="space-y-4">
            {dataAccessLog.map((access) => (
              <Card key={access.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {access.accessor
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{access.accessor}</p>
                        <p className="text-sm text-gray-600">{access.accessorRole}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>Accessed: {access.dataType}</span>
                          <span>Duration: {access.duration}</span>
                          <span>{access.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={access.authorized ? "default" : "destructive"}>
                        {access.authorized ? "Authorized" : "Unauthorized"}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">{access.purpose}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Security Tab */}
        {/* <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication & Security
              </CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                  {!twoFactorEnabled && (
                    <Button size="sm" className="bg-[#7eb0d5] hover:bg-[#5a8bb5]">
                      Setup 2FA
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Biometric Authentication</Label>
                  <p className="text-sm text-muted-foreground">Use fingerprint or face recognition</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Fingerprint className="h-4 w-4 text-gray-400" />
                  <Switch />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Login Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Active Sessions</h4>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    End All Sessions
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-600">Chrome on Windows • San Francisco, CA</p>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Server className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Mobile App</p>
                        <p className="text-sm text-gray-600">iOS App • Last active 2 hours ago</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      End Session
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Security Alerts</h3>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Alert Settings
            </Button>
          </div>

          <div className="space-y-4">
            {securityAlerts.map((alert) => (
              <Card key={alert.id} className={`${!alert.resolved ? "border-yellow-200 bg-yellow-50" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">{getSeverityIcon(alert.severity)}</div>
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={alert.resolved ? "default" : "secondary"}>
                        {alert.resolved ? "Resolved" : "Active"}
                      </Badge>
                      {!alert.resolved && (
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alert Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Preferences
              </CardTitle>
              <CardDescription>Choose which security events to be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Suspicious login attempts</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-base">Data access by new providers</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-base">Privacy setting changes</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-base">Data export requests</Label>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

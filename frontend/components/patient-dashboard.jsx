"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import MessagingSystem from "@/components/messaging-system"
import PrivacySecurityCenter from "@/components/privacy-security"
import HealthChatbot from "@/components/ai-chatbot"
import {
  Calendar,
  MessageSquare,
  User,
  Shield,
  Eye,
  Settings,
  FileText,
  Heart,
  Activity,
  Download,
  Share2,
  Bell,
  Lock,
  CheckCircle,
  Plus,
  Stethoscope,
  Bot,
} from "lucide-react"

export default function PatientDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [privacySettings, setPrivacySettings] = useState({
    shareWithDoctors: true,
    shareWithSpecialists: false,
    shareWithPharmacy: true,
    allowResearch: false,
    dataRetention: "5years",
  })

  // Mock patient data
  const patientInfo = {
    name: "John Smith",
    age: 42,
    bloodType: "O+",
    allergies: ["Penicillin", "Shellfish"],
    conditions: ["Hypertension", "Type 2 Diabetes"],
    emergencyContact: "Jane Smith - (555) 123-4567",
    avatar: "/man.jpg",
  }

  const healthRecords = [
    {
      id: 1,
      type: "Lab Results",
      date: "2024-01-15",
      doctor: "Dr. Sarah Wilson",
      status: "normal",
      description: "Blood glucose levels within normal range",
      shared: true,
    },
    {
      id: 2,
      type: "Prescription",
      date: "2024-01-12",
      doctor: "Dr. Michael Chen",
      status: "active",
      description: "Metformin 500mg - Take twice daily",
      shared: true,
    },
    {
      id: 3,
      type: "Visit Summary",
      date: "2024-01-10",
      doctor: "Dr. Sarah Wilson",
      status: "completed",
      description: "Routine checkup - Blood pressure stable",
      shared: false,
    },
  ]

  const activityLog = [
    {
      id: 1,
      action: "Lab results shared with Dr. Wilson",
      timestamp: "2024-01-15 10:30 AM",
      type: "data_share",
      secure: true,
    },
    {
      id: 2,
      action: "Appointment scheduled with Dr. Chen",
      timestamp: "2024-01-14 2:15 PM",
      type: "appointment",
      secure: true,
    },
    {
      id: 3,
      action: "Message sent to Dr. Wilson",
      timestamp: "2024-01-13 9:45 AM",
      type: "message",
      secure: true,
    },
    {
      id: 4,
      action: "Privacy settings updated",
      timestamp: "2024-01-12 4:20 PM",
      type: "privacy",
      secure: true,
    },
  ]

  const appointments = [
    {
      id: 1,
      doctor: "Dr. Sarah Wilson",
      specialty: "Endocrinology",
      date: "2024-01-25",
      time: "10:00 AM",
      type: "Follow-up",
      status: "confirmed",
      location: "Medical Center - Room 205",
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "Cardiology",
      date: "2024-02-02",
      time: "2:30 PM",
      type: "Consultation",
      status: "pending",
      location: "Heart Institute - Suite 301",
    },
  ]

  const messages = [
    {
      id: 1,
      from: "Dr. Sarah Wilson",
      subject: "Lab Results Available",
      message: "Your recent blood work shows good progress. Please continue your current medication regimen.",
      time: "2 hours ago",
      unread: true,
      priority: "normal",
    },
    {
      id: 2,
      from: "Dr. Michael Chen",
      subject: "Appointment Reminder",
      message: "This is a reminder about your upcoming appointment on February 2nd.",
      time: "1 day ago",
      unread: false,
      priority: "normal",
    },
  ]

  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8 text-[#7eb0d5]" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Health Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.walletAddress}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-[#b2e061]" />
                <span>Secure Session</span>
              </div>
              <Button onClick={onLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Health Records
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Patient Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={patientInfo.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {patientInfo.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    <div>
                      <h3 className="font-semibold text-lg">{patientInfo.name}</h3>
                      <p className="text-gray-600">Age: {patientInfo.age}</p>
                      <p className="text-gray-600">Blood Type: {patientInfo.bloodType}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Allergies</h4>
                      <div className="space-y-1">
                        {patientInfo.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive" className="mr-2">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Conditions</h4>
                      <div className="space-y-1">
                        {patientInfo.conditions.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="mr-2">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>Emergency Contact:</strong> {patientInfo.emergencyContact}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Records</CardTitle>
                  <FileText className="h-4 w-4 text-[#7eb0d5]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthRecords.length}</div>
                  <p className="text-xs text-muted-foreground">2 shared with doctors</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-[#b2e061]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointments.length}</div>
                  <p className="text-xs text-muted-foreground">Next: Jan 25th</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-[#FFDF00]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1</div>
                  <p className="text-xs text-muted-foreground">From Dr. Wilson</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Privacy Status</CardTitle>
                  <Shield className="h-4 w-4 text-[#b2e061]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#b2e061]">Secure</div>
                  <p className="text-xs text-muted-foreground">All data encrypted</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest healthcare interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLog.slice(0, 4).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {activity.type === "data_share" && <Share2 className="h-5 w-5 text-[#7eb0d5]" />}
                        {activity.type === "appointment" && <Calendar className="h-5 w-5 text-[#b2e061]" />}
                        {activity.type === "message" && <MessageSquare className="h-5 w-5 text-[#FFDF00]" />}
                        {activity.type === "privacy" && <Settings className="h-5 w-5 text-gray-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.timestamp}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="h-4 w-4 text-[#b2e061]" />
                        <span className="text-xs text-gray-500">Secure</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Health Records</h2>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
                <Button className="bg-[#7eb0d5] hover:bg-[#5a8bb5]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Record
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {healthRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-[#7eb0d5] rounded-lg p-3">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{record.type}</h3>
                          <p className="text-gray-600">{record.description}</p>
                          <p className="text-sm text-gray-500">
                            {record.date} • Dr. {record.doctor}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge
                            variant={
                              record.status === "Normal"
                                ? "default"
                                : record.status === "Active"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {record.status}
                          </Badge>
                          <div className="flex items-center mt-2 text-sm">
                            {record.shared ? (
                              <div className="flex items-center text-[#b2e061]">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Shared
                              </div>
                            ) : (
                              <div className="flex items-center text-gray-500">
                                <Lock className="h-4 w-4 mr-1" />
                                Private
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessagingSystem userType="patient" currentUser={user} />
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Appointments</h2>
              <Button className="bg-[#b2e061] hover:bg-[#8fb84d] text-white">
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </div>

            <div className="grid gap-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-[#7eb0d5] text-white rounded-lg p-3">
                          <Stethoscope className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{appointment.doctor}</h3>
                          <p className="text-gray-600">{appointment.specialty}</p>
                          <p className="text-sm text-gray-500">
                            {appointment.date} at {appointment.time}
                          </p>
                          <p className="text-sm text-gray-500">{appointment.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                            {appointment.status}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">{appointment.type}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button size="sm" variant="outline">
                            Reschedule
                          </Button>
                          <Button size="sm" variant="outline">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Privacy Settings Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Privacy & Consent Management</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-[#b2e061]" />
                <span>All changes are encrypted and logged</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Data Sharing Permissions
                </CardTitle>
                <CardDescription>Control who can access your health information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share with Primary Care Doctors</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow your primary care physicians to access your health records
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.shareWithDoctors}
                    onCheckedChange={(checked) => handlePrivacyChange("shareWithDoctors", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share with Specialists</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow specialist doctors to access relevant health information
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.shareWithSpecialists}
                    onCheckedChange={(checked) => handlePrivacyChange("shareWithSpecialists", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share with Pharmacy</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow pharmacies to access prescription and allergy information
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.shareWithPharmacy}
                    onCheckedChange={(checked) => handlePrivacyChange("shareWithPharmacy", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Allow Research Use</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow anonymized data to be used for medical research (optional)
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.allowResearch}
                    onCheckedChange={(checked) => handlePrivacyChange("allowResearch", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security & Audit
                </CardTitle>
                <CardDescription>Monitor access to your health information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-[#b2e061]" />
                      <span className="font-medium">End-to-End Encryption</span>
                    </div>
                    <p className="text-sm text-gray-600">All your data is encrypted in transit and at rest</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Eye className="h-5 w-5 text-[#7eb0d5]" />
                      <span className="font-medium">Access Logging</span>
                    </div>
                    <p className="text-sm text-gray-600">Every access to your data is logged and auditable</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Eye className="h-4 w-4 mr-2" />
                    View Access Log
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download My Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose how you want to be notified about your health data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Email notifications for new messages</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base">SMS alerts for appointment reminders</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base">Notify when data is accessed</Label>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <PrivacySecurityCenter userType="patient" currentUser={user} />
          </TabsContent>
          {/* chatbot */}
          <TabsContent value="chatbot" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">AI Health Assistant</h2>
          </div>
          <HealthChatbot user={user} />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

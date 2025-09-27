"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { logout } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import MessagingSystem from "@/components/messaging-system"
import PrivacySecurityCenter from "@/components/privacy-security"
import {
  Calendar,
  MessageSquare,
  Users,
  Shield,
  Eye,
  Share2,
  Clock,
  FileText,
  Heart,
  Activity,
  Search,
  Filter,
  MoreHorizontal,
  Unlock,
} from "lucide-react"

export default function DoctorDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedPatient, setSelectedPatient] = useState(null)

  // Mock data
  const patients = [
    {
      id: 1,
      name: "Sarah Johnson",
      age: 34,
      condition: "Diabetes Type 2",
      lastVisit: "2024-01-15",
      status: "stable",
      avatar: "/diverse-woman-portrait.png",
      riskLevel: "low",
      sharedData: ["Blood Sugar Logs", "Medication History", "Lab Results"],
    },
    {
      id: 2,
      name: "Michael Chen",
      age: 45,
      condition: "Hypertension",
      lastVisit: "2024-01-12",
      status: "monitoring",
      avatar: "/man.jpg",
      riskLevel: "medium",
      sharedData: ["Blood Pressure Logs", "Exercise Data", "Diet Tracking"],
    },
    {
      id: 3,
      name: "Emma Davis",
      age: 28,
      condition: "Asthma",
      lastVisit: "2024-01-10",
      status: "stable",
      avatar: "/diverse-woman-portrait.png",
      riskLevel: "low",
      sharedData: ["Inhaler Usage", "Symptom Diary", "Allergy Tests"],
    },
  ]

  const appointments = [
    {
      id: 1,
      patient: "Sarah Johnson",
      time: "09:00 AM",
      date: "2024-01-20",
      type: "Follow-up",
      status: "confirmed",
    },
    {
      id: 2,
      patient: "Michael Chen",
      time: "10:30 AM",
      date: "2024-01-20",
      type: "Check-up",
      status: "pending",
    },
    {
      id: 3,
      patient: "Emma Davis",
      time: "02:00 PM",
      date: "2024-01-20",
      type: "Consultation",
      status: "confirmed",
    },
  ]

  const messages = [
    {
      id: 1,
      patient: "Sarah Johnson",
      message: "My blood sugar readings have been higher than usual this week.",
      time: "2 hours ago",
      unread: true,
      priority: "high",
    },
    {
      id: 2,
      patient: "Michael Chen",
      message: "Thank you for the new medication recommendations.",
      time: "1 day ago",
      unread: false,
      priority: "normal",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8 text-[#7eb0d5]" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Doctor Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, Dr. {user.walletAddress}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-[#b2e061]" />
                <span>Secure Session</span>
              </div>
              <Button 
                onClick={async () => {
                  try {
                    await logout();
                    if (onLogout) onLogout();
                  } catch (error) {
                    console.error('Logout failed:', error);
                  }
                }} 
                variant="outline"
              >
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
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Patients
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            {/* <TabsTrigger value="sharing" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Data Sharing
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger> */}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                  <Users className="h-4 w-4 text-[#7eb0d5]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">127</div>
                  <p className="text-xs text-muted-foreground">+3 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-[#b2e061]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">2 pending confirmation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-[#FFDF00]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">1 high priority</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Requests</CardTitle>
                  <Share2 className="h-4 w-4 text-[#7eb0d5]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Pending approval</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest patient interactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patients.slice(0, 3).map((patient) => (
                    <div key={patient.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <Avatar>
                        <AvatarImage src={patient.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-gray-600">Last visit: {patient.lastVisit}</p>
                      </div>
                      <Badge variant={patient.status === "stable" ? "default" : "secondary"}>{patient.status}</Badge>
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

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Patient Records</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search patients..." className="pl-10 w-64" />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {patients.map((patient) => (
                <Card key={patient.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={patient.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{patient.name}</h3>
                          <p className="text-gray-600">
                            Age: {patient.age} • {patient.condition}
                          </p>
                          <p className="text-sm text-gray-500">Last visit: {patient.lastVisit}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge
                            variant={
                              patient.riskLevel === "high"
                                ? "destructive"
                                : patient.riskLevel === "medium"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {patient.riskLevel} risk
                          </Badge>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Shield className="h-4 w-4 mr-1 text-[#b2e061]" />
                            {patient.sharedData.length} data points shared
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Button
                            size="sm"
                            className="bg-[#7eb0d5] hover:bg-[#5a8bb5]"
                            onClick={() => setSelectedPatient(patient)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Records
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <MessagingSystem userType="doctor" currentUser={user} />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Today's Schedule</h2>
              <Button className="bg-[#b2e061] hover:bg-[#8fb84d] text-white">
                <Calendar className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </div>

            <div className="grid gap-4">
              {appointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-[#7eb0d5] text-white rounded-lg p-3">
                          <Clock className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{appointment.patient}</h3>
                          <p className="text-gray-600">{appointment.type}</p>
                          <p className="text-sm text-gray-500">
                            {appointment.time} • {appointment.date}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                          {appointment.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Data Sharing Tab */}
          <TabsContent value="sharing" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Data Sharing Controls</h2>
              <Button className="bg-[#FFDF00] hover:bg-[#e6c600] text-black">
                <Share2 className="h-4 w-4 mr-2" />
                Share Data
              </Button>
            </div>

            <div className="grid gap-6">
              {patients.map((patient) => (
                <Card key={patient.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={patient.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{patient.name}</CardTitle>
                          <CardDescription>Data sharing permissions</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-[#b2e061]" />
                        <span className="text-sm text-gray-600">Privacy Protected</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {patient.sharedData.map((dataType, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-[#7eb0d5]" />
                              <span className="text-sm font-medium">{dataType}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Unlock className="h-4 w-4 text-[#b2e061]" />
                              <Button size="sm" variant="outline">
                                Revoke
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Last shared: {patient.lastVisit} • Audit trail available
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            View Audit
                          </Button>
                          <Button size="sm" className="bg-[#7eb0d5] hover:bg-[#5a8bb5]">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share More
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Privacy & Security Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <PrivacySecurityCenter userType="doctor" currentUser={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

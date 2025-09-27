"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Heart, Users, Lock } from "lucide-react"
import DoctorDashboard from "@/components/doctor-dashboard"
import PatientDashboard from "@/components/patient-dashboard"
import { ethers } from "ethers"
import PatientForm from "@/components/forms"

// MetaMask Login Form
// ...existing code...

function LoginForm({ userType, onLogin }) {
  const [walletAddress, setWalletAddress] = useState("")
  const [error, setError] = useState("")

   const handleMetaMaskLogin = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError("MetaMask is not installed.")
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      const address = accounts[0]
      setWalletAddress(address)
      
      // Always set exists to false to show the registration form
      onLogin(address, userType, false)
    } catch (err) {
      setError("Wallet connection failed.")
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <Button 
        onClick={handleMetaMaskLogin}
        className="w-full bg-[#703FA1] hover:bg-[#5a2f81]"
      >
        {walletAddress ? 
          `Connected: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : 
          'Connect with MetaMask'
        }
      </Button>
    </div>
  )
}

export default function HomePage() {
  const [userType, setUserType] = useState("patient")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [needsRegistration, setNeedsRegistration] = useState(false)

  // Modify the handleLogin function
const handleLogin = (walletAddress, type) => {
  setCurrentUser({ walletAddress, type })
  setIsLoggedIn(true)
  // Only show registration form for patients
  setNeedsRegistration(type === "patient")
}

// Update the conditional rendering section
if (isLoggedIn && currentUser) {
  if (needsRegistration && currentUser.type === "patient") {
    return (
      <PatientForm 
        walletAddress={currentUser.walletAddress}
        onFormSubmit={async (formData) => {
          try {
            // Simulate API call with setTimeout
            await new Promise(resolve => setTimeout(resolve, 1000))
            setNeedsRegistration(false)
          } catch (error) {
            console.error('Registration error:', error)
          }
        }}
      />
    )
  }
  
  // Show appropriate dashboard based on user type
  return currentUser.type === "doctor" ? 
    <DoctorDashboard user={currentUser} onLogout={() => setIsLoggedIn(false)} /> :
    <PatientDashboard user={currentUser} onLogout={() => setIsLoggedIn(false)} />
}

  // ... rest of HomePage component remains same

  // ///////////////////////////////////////////////////////////////////
  // ...rest of HomePage component

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-[#7eb0d5]" />
              <h1 className="text-2xl font-bold text-gray-900">HealthShare</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Shield className="h-5 w-5 text-[#b2e061]" />
              <span className="text-sm text-gray-600">Secure & Private</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Secure Healthcare Data Exchange</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connecting patients and healthcare providers through secure, privacy-focused data sharing
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-[#7eb0d5] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
            <p className="text-gray-600">End-to-end encryption and granular privacy controls</p>
          </div>
          <div className="text-center">
            <div className="bg-[#b2e061] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Seamless Sharing</h3>
            <p className="text-gray-600">Easy data sharing between patients and providers</p>
          </div>
          <div className="text-center">
            <div className="bg-[#FFDF00] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Better Care</h3>
            <p className="text-gray-600">Improved patient outcomes through better coordination</p>
          </div>
        </div>

        {/* Authentication */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Your Account</CardTitle>
            <CardDescription>Sign in to access your secure healthcare dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={userType} onValueChange={setUserType}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="patient">Patient</TabsTrigger>
                <TabsTrigger value="doctor">Doctor</TabsTrigger>
              </TabsList>

              <TabsContent value="patient">
                <LoginForm userType="patient" onLogin={handleLogin} />
              </TabsContent>
              <TabsContent value="doctor">
                <LoginForm userType="doctor" onLogin={handleLogin} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

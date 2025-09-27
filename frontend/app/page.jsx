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

// MetaMask Login Form
// ...existing code...

function LoginForm({ userType, onLogin }) {
  const [walletAddress, setWalletAddress] = useState("")
  const [error, setError] = useState("")
  const [dashboard, setDashboard] = useState(null)

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

      // Render appropriate dashboard based on userType
      if (userType === "doctor") {
        setDashboard(<DoctorDashboard user={{ walletAddress: address }} />)
      } else if (userType === "patient") {
        setDashboard(<PatientDashboard user={{ walletAddress: address }} />)
      }
    } catch (err) {
      setError("Wallet connection failed.")
    }
  }

  if (dashboard) {
    return dashboard
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
    } catch (err) {
      setError("Wallet connection failed.")
    }
  }

  if (walletAddress) {
    if (userType === "doctor") {
      return <DoctorDashboard user={{ walletAddress }} />
    } else if (userType === "patient") {
      return <PatientDashboard user={{ walletAddress }} />
    }
  }

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
              </TabsContent>
              <TabsContent value="doctor">
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

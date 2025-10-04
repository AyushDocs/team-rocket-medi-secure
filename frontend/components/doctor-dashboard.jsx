"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Shield, Activity, Users, Calendar } from "lucide-react"
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore"
import app from "../firebase.config"

const db = getFirestore(app)

export default function DoctorDashboard({ account, contract, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [patients, setPatients] = useState([])
  const [appointments] = useState([
    { id: 1, patient: "Sarah Johnson", time: "09:00 AM", date: "2024-01-20", type: "Follow-up", status: "confirmed" },
    { id: 2, patient: "Michael Chen", time: "10:30 AM", date: "2024-01-20", type: "Check-up", status: "pending" },
    { id: 3, patient: "Emma Davis", time: "02:00 PM", date: "2024-01-20", type: "Consultation", status: "confirmed" },
  ])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedPatient, setSelectedPatient] = useState("")
  const [patientIdToAdd, setPatientIdToAdd] = useState("")
  const [patientWallet, setPatientWallet] = useState("")
  const [documentId, setDocumentId] = useState("")
  const [requestMessage, setRequestMessage] = useState("")
  const [status, setStatus] = useState("")

  // --- Fetch doctor's patients from contract ---
  const fetchPatients = async () => {
    try {
      const result = await contract.methods.getDoctorPatients().call({ from: account })
      setPatients(result)
    } catch (err) {
      console.error("Failed to fetch patients:", err)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [contract, account])

  // --- Handle patient addition ---
  const handleAddPatient = async (e) => {
    e.preventDefault()
    if (!patientIdToAdd.trim()) return

    try {
      setStatus("Adding patient...")
      await contract.methods.addPatient(patientIdToAdd).send({ from: account })
      setStatus("Patient added successfully ✅")
      setPatientIdToAdd("")
      fetchPatients()
    } catch (err) {
      console.error("Add patient failed:", err)
      setStatus("Failed to add patient ❌")
    }
  }

  // --- Request document access ---
  const requestAccess = async () => {
    if (!patientWallet || !documentId) return
    try {
      await contract.methods.requestAccess(patientWallet, documentId).send({ from: account })
      setRequestMessage("Access request sent successfully ✅")
    } catch (error) {
      console.error("Access request failed:", error)
      setRequestMessage("Failed to send access request ❌")
    }
  }

  // --- Listen to AccessRequested events ---
  useEffect(() => {
    if (!contract) return
    const sub = contract.events
      .AccessRequested({ fromBlock: "latest" })
      .on("data", (event) => {
        const { patient, doctor, ipfsHash } = event.returnValues
        if (doctor.toLowerCase() === account.toLowerCase()) {
          console.log(`Access requested for document ${ipfsHash} from patient ${patient}`)
        }
      })

    // return () => sub.unsubscribe()
  }, [contract, account])

  // --- Real-time messages from Firestore ---
  useEffect(() => {
    if (!selectedPatient) return
    const messagesRef = collection(db, "chats", `${account}_${selectedPatient}`, "messages")
    const q = query(messagesRef, orderBy("timestamp"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setMessages(fetched)
    })
    return () => unsubscribe()
  }, [selectedPatient])

  // --- Send chat message ---
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient) return
    try {
      const messagesRef = collection(db, "chats", `${account}_${selectedPatient}`, "messages")
      await addDoc(messagesRef, {
        sender: account,
        content: newMessage,
        timestamp: new Date().toISOString(),
      })
      setNewMessage("")
    } catch (error) {
      console.error("Message send failed:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Heart className="h-7 w-7 text-[#7eb0d5]" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Doctor Dashboard</h1>
                <p className="text-sm text-gray-600 truncate">Wallet: {account}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-[#b2e061]" />
                <span>Secure Session</span>
              </div>
              <Button onClick={onLogout} variant="outline" className="text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2"><Activity className="h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2"><Users className="h-4 w-4" />Patients</TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2"><Calendar className="h-4 w-4" />Appointments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          {/* --- Overview --- */}
          <TabsContent value="overview">
            <Card>
              <CardHeader><CardTitle>Welcome</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">Manage your patients and request access to their records.</p>
                <form onSubmit={handleAddPatient} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={patientIdToAdd}
                    onChange={(e) => setPatientIdToAdd(e.target.value)}
                    placeholder="Enter patient ID"
                    className="border p-2 rounded flex-1"
                  />
                  <Button type="submit">Add Patient</Button>
                </form>
                {status && <p className="text-sm text-gray-600 mt-2">{status}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- Patients --- */}
          <TabsContent value="patients">
            <Card>
              <CardHeader><CardTitle>Request Patient Data Access</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <input
                  type="text"
                  placeholder="Patient Wallet Address"
                  value={patientWallet}
                  onChange={(e) => setPatientWallet(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Document ID"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <Button onClick={requestAccess} className="w-full bg-[#703FA1] hover:bg-[#5a2f81]">
                  Request Access
                </Button>
                {requestMessage && <div className="text-sm text-gray-600">{requestMessage}</div>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- Appointments --- */}
          <TabsContent value="appointments">
            <Card>
              <CardHeader><CardTitle>Appointments</CardTitle></CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p>No appointments found.</p>
                ) : (
                  <ul className="space-y-3">
                    {appointments.map((a) => (
                      <li key={a.id} className="p-3 border rounded">
                        <p><strong>{a.patient}</strong> — {a.type}</p>
                        <p className="text-sm text-gray-600">{a.date} at {a.time} ({a.status})</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- Messages --- */}
          <TabsContent value="messages">
            <Card>
              <CardHeader><CardTitle>Secure Chat</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select patient</option>
                    {patients.map((id, i) => (
                      <option key={i} value={id}>{`Patient ${id}`}</option>
                    ))}
                  </select>

                  <div className="border p-3 h-64 overflow-y-auto bg-white rounded">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2 mb-2 rounded-lg ${
                          msg.sender === account ? "bg-blue-100 text-right" : "bg-gray-100"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message"
                      className="flex-1 p-2 border rounded"
                    />
                    <Button onClick={sendMessage}>Send</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

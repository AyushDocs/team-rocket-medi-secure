"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Shield, Activity, FileText } from "lucide-react"
import { collection, addDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase.config";

export default function PatientDashboard({ account, contract, doctorContract, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [patientInfo, setPatientInfo] = useState(null)
  const [healthRecords, setHealthRecords] = useState([])
  const [accessRequests, setAccessRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  console.log('doctorContract',doctorContract)
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch patient details from the contract
        const patientId = await contract.methods.walletToPatientId(account).call()
        if (patientId === "0") {
          throw new Error("Patient not registered.")
        }

        const patientDetails = await contract.methods.getPatientDetails(patientId).call()
        const records = await contract.methods.getMedicalRecords(patientId).call()

        setPatientInfo({
          name: patientDetails.name,
          age: patientDetails.age,
          bloodType: patientDetails.bloodGroup,
          email: patientDetails.email,
        })

        setHealthRecords(
          records.map((record, index) => ({
            id: index + 1,
            type: "Medical Record",
            date: "Unknown", // Add logic to fetch or format dates if available
            description: record,
            shared: true,
          }))
        )
      } catch (err) {
        setError(err.message)
        setPatientInfo({
          name: "John Doe",
          age: 30,
          bloodType: "A+",
          email: "john.doe@example.com",
        })
        setHealthRecords([
          {
            id: 1,
            type: "Lab Results",
            date: "2024-01-15",
            description: "Blood glucose levels within normal range",
            shared: true,
          },
        ]) // Dummy data
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [account, contract])

  useEffect(() => {
    const listenForAccessRequests = async () => {
      try {
        contract.events.AccessRequested({ fromBlock: "latest" })
          .on("data", (event) => {
            const { patient, doctor, ipfsHash } = event.returnValues;
            if (patient.toLowerCase() === account.toLowerCase()) {
              setAccessRequests((prevRequests) => [
                ...prevRequests,
                { doctor, ipfsHash },
              ]);
            }
          })
          .on("error", (error) => {
            console.error("Error listening for access requests:", error);
          });
      } catch (error) {
        console.error("Failed to set up event listener:", error);
      }
    };

    listenForAccessRequests();
  }, [account, contract]);

  const uploadMedicalRecord = async (file) => {
    try {
      setLoading(true)
      setError(null)

      // Upload file to Express server
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload file to the server")
      }

      const data = await response.json()
      const ipfsHash = data.ipfsHash

      // Store IPFS hash in the contract
      const patientId = await contract.methods.walletToPatientId(account).call()
      if (patientId === "0") {
        throw new Error("Patient not registered.")
      }

      await contract.methods.addMedicalRecord(ipfsHash).send({ from: account })

      // Update health records
      setHealthRecords((prevRecords) => [
        ...prevRecords,
        {
          id: prevRecords.length + 1,
          type: "Medical Record",
          date: new Date().toISOString().split("T")[0],
          description: ipfsHash,
          shared: true,
        },
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Update grantAccess to align with the contract
  const handleAccessResponse = async (doctor, ipfsHash, grant) => {
    try {
      if (grant) {
        await contract.methods.grantAccess(doctor, ipfsHash).send({ from: account });
      }
      setAccessRequests((prevRequests) =>
        prevRequests.filter(
          (request) => request.doctor !== doctor || request.ipfsHash !== ipfsHash
        )
      );
    } catch (error) {
      console.error("Failed to respond to access request:", error);
    }
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const c = doctorContract || contract
        const doctorList = await c.methods.getAllDoctors().call();
        setDoctors(doctorList);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      }
    };

    fetchDoctors();
  }, [contract, doctorContract]);

  useEffect(() => {
    if (selectedDoctor) {
      // Use a per-chat subcollection like doctor dashboard: chats/{chatId}/messages
      const messagesRef = collection(db, "chats", `${account}_${selectedDoctor}`, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatMessages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMessages(chatMessages);
      });

      return () => unsubscribe();
    }
  }, [selectedDoctor, account]);

  const sendMessage = async () => {
    if (newMessage.trim() === "" || !selectedDoctor) return;

    try {
      const messagesRef = collection(db, "chats", `${account}_${selectedDoctor}`, "messages");
      await addDoc(messagesRef, {
        sender: account,
        message: newMessage,
        timestamp: new Date().toISOString(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src="/man.jpg" alt="Patient Avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Health Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {account}</p>
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
            <TabsTrigger value="records" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Records
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Name: {patientInfo.name}</p>
                <p>Age: {patientInfo.age}</p>
                <p>Blood Type: {patientInfo.bloodType}</p>
                <p>Email: {patientInfo.email}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  type="file"
                  onChange={(e) => uploadMedicalRecord(e.target.files[0])}
                  className="mb-4"
                />
                {healthRecords.length === 0 ? (
                  <p>No medical records found.</p>
                ) : (
                  <ul>
                    {healthRecords.map((record) => (
                      <li key={record.id}>{record.description}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access-requests">
            <Card>
              <CardHeader>
                <CardTitle>Access Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {accessRequests.length === 0 ? (
                  <p>No access requests.</p>
                ) : (
                  <ul>
                    {accessRequests.map((request, index) => (
                      <li key={index} className="mb-4">
                        <p>Doctor: {request.doctor}</p>
                        <p>Document ID: {request.ipfsHash}</p>
                        <div className="flex space-x-4 mt-2">
                          <Button
                            onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, true)}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Grant Access
                          </Button>
                          <Button
                            onClick={() => handleAccessResponse(request.doctor, request.ipfsHash, false)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Reject Access
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Chat with a Doctor</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label htmlFor="doctor-select">Select a Doctor:</label>
                  <select
                    id="doctor-select"
                    value={selectedDoctor || ""}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="mb-4"
                  >
                    <option value="" disabled>Select a doctor</option>
                    {doctors.map((doctor, index) => (
                      <option key={index} value={doctor.doctorId || doctor["doctorId"]}>
                        {doctor.name || doctor["name"]} - {doctor.specialization || doctor["specialization"]}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDoctor && (
                  <div>
                    <div className="chat-window">
                      {messages.map((msg, index) => (
                        <div key={index} className={msg.sender === account ? "sent" : "received"}>
                          <p>{msg.message}</p>
                        </div>
                      ))}
                    </div>

                    <div className="chat-input">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                      />
                      <Button onClick={sendMessage}>Send</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

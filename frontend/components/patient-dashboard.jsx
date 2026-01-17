"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ethers } from "ethers"
import { Activity, Eye, FileText, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import io from "socket.io-client"
import { useWeb3 } from "../context/Web3Context"

export default function PatientDashboard() {
  const { patientContract, doctorContract, account, disconnect } = useWeb3()
  const router = useRouter()
  
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
  const [socket, setSocket] = useState(null);

  const [myPatientId, setMyPatientId] = useState(null)
  // Document Viewing State
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedDocUrl, setSelectedDocUrl] = useState("")
  const [viewingDoc, setViewingDoc] = useState(false)

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientContract || !account) return;
      try {
        setLoading(true)
        setError(null)

        // Fetch patient details from the contract
        const patientId = await patientContract.walletToPatientId(account)
        if (patientId.toString() === "0") {
          throw new Error("Patient not registered.")
        }
        setMyPatientId(patientId.toString())

        const patientDetails = await patientContract.getPatientDetails(patientId)
        const records = await patientContract.getMedicalRecords(patientId)

        // Ethers Result access (name, age, bloodGroup, email)
        setPatientInfo({
          name: patientDetails.name,
          age: Number(patientDetails.age),
          bloodType: patientDetails.bloodGroup,
          email: patientDetails.email,
        })

        const recordsArray = Array.from(records);
        setHealthRecords(
          recordsArray.map((record, index) => ({
            id: index + 1,
            type: "Medical Record",
            date: "Unknown", 
            description: record, // This is the IPFS Hash
            shared: true,
          }))
        )
      } catch (err) {
        setError(err.message)
        // Fallback dummy data for demo/error state
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
            description: "QmTestHash123",
            shared: true,
          },
        ]) 
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [account, patientContract])

  useEffect(() => {
    if(!doctorContract || !account) return;

    const handleAccessRequested = (patient, doctor, ipfsHash) => {
         if (patient.toLowerCase() === account.toLowerCase()) {
              setAccessRequests((prevRequests) => [
                ...prevRequests,
                { doctor, ipfsHash },
              ]);
         }
    };

    doctorContract.on("AccessRequested", handleAccessRequested);

    return () => {
        doctorContract.off("AccessRequested", handleAccessRequested);
    };
  }, [account, doctorContract]);

  const uploadMedicalRecord = async (file) => {
    if(!patientContract) return;
    try {
      setLoading(true)
      setError(null)

      // Upload file to Express server
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userAddress", account); // Pass userAddress to backend if needed

      const response = await fetch("http://localhost:5000/files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file to the server")
      }

      const data = await response.json()
      const ipfsHash = data.ipfsHash

      // Store IPFS hash in the contract
      const patientId = await patientContract.walletToPatientId(account)
      if (patientId.toString() === "0") {
        throw new Error("Patient not registered.")
      }

      const tx = await patientContract.addMedicalRecord(ipfsHash)
      await tx.wait()

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

  // Handle viewing document
  const handleViewDocument = async (ipfsHash) => {
      try {
          setViewingDoc(true);
          // 1. Sign the IPFS hash to prove identity
          if (!window.ethereum) throw new Error("No crypto wallet found");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const signature = await signer.signMessage(ipfsHash);

          // 2. Fetch the document URL from the server
          // Note: Since I am the patient, patientAddress is my account
          const response = await fetch(`http://localhost:5000/files/${ipfsHash}?userAddress=${account}&signature=${signature}&patientAddress=${account}`);
          
          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || "Failed to fetch document access");
          }

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setSelectedDocUrl(url);
          setViewModalOpen(true);

      } catch (err) {
          console.error("View document error:", err);
          alert("Error opening document: " + err.message);
      } finally {
          setViewingDoc(false);
      }
  };


  // Update grantAccess to align with the contract
  const handleAccessResponse = async (doctor, ipfsHash, grant) => {
    if(!doctorContract) return;
    try {
      if (grant) {
        const tx = await doctorContract.grantAccess(doctor, ipfsHash);
        await tx.wait();
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
      if(!doctorContract) return;
      try {
        const doctorList = await doctorContract.getAllDoctors();
        setDoctors(Array.from(doctorList));
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      }
    };

    fetchDoctors();
  }, [doctorContract]);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);
    return () => newSocket.close();
  }, [account]);

  useEffect(() => {
    if(!socket) return;
    
    socket.on("receive_message", (data) => {
        setMessages((list) => [...list, data]);
    });

    socket.on("load_history", (history) => {
        setMessages(history);
    });
    
    return () => {
        socket.off("receive_message");
        socket.off("load_history");
    };
  }, [socket]);

  useEffect(() => {
    if (selectedDoctor && myPatientId && socket) {
      const roomId = `${myPatientId}_${selectedDoctor}`;
      socket.emit("join_room", roomId);
      setMessages([]); 
    }
  }, [selectedDoctor, myPatientId, socket]);

  const sendMessage = async () => {
    if (newMessage.trim() === "" || !selectedDoctor || !myPatientId || !socket) return;

    const roomId = `${myPatientId}_${selectedDoctor}`;
    const messageData = {
      room: roomId,
      sender: account,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    await socket.emit("send_message", messageData);
    setMessages((list) => [...list, messageData]);
    setNewMessage("");
  };

  const handleLogout = () => {
      disconnect();
      router.push("/");
  }

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
                onClick={handleLogout} 
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
            <TabsTrigger value="access-requests" className="flex items-center gap-2">
              Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Name: {patientInfo?.name}</p>
                <p>Age: {patientInfo?.age}</p>
                <p>Blood Type: {patientInfo?.bloodType}</p>
                <p>Email: {patientInfo?.email}</p>
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
                  <ul className="space-y-4">
                    {healthRecords.map((record) => (
                      <li key={record.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg bg-white shadow-sm">
                        <div className="mb-2 sm:mb-0">
                            <p className="font-medium text-gray-700 truncate max-w-md" title={record.description}>
                                {record.description}
                            </p>
                            <p className="text-xs text-gray-400">IPFS Hash</p>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDocument(record.description)}
                            disabled={viewingDoc}
                        >
                           <Eye className="w-4 h-4 mr-2" />
                           View
                        </Button>
                      </li>
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
                    className="mb-4 p-2 border rounded w-full"
                  >
                    <option value="" disabled>Select a doctor</option>
                    {doctors.map((doctor, index) => (
                      <option key={index} value={doctor.doctorId ? doctor.doctorId.toString() : index}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDoctor && (
                  <div>
                    <div className="chat-window border p-4 h-64 overflow-y-auto bg-gray-100 rounded mb-4">
                      {messages.map((msg, index) => (
                        <div key={index} className={`mb-2 p-2 rounded ${msg.sender === account ? "bg-blue-200 ml-auto w-fit" : "bg-white w-fit"}`}>
                          <p>{msg.message}</p>
                          <small className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</small>
                        </div>
                      ))}
                    </div>

                    <div className="chat-input flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border rounded"
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
      
      {/* Document Viewer Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
                <DialogTitle>Document Viewer</DialogTitle>
            </DialogHeader>
            <div className="flex-1 w-full h-full border rounded bg-gray-100 flex items-center justify-center">
                {selectedDocUrl ? (
                    <iframe 
                        src={selectedDocUrl} 
                        className="w-full h-full" 
                        title="Document"
                    />
                ) : (
                    <p>Loading document...</p>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

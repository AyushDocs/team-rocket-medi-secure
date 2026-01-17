"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Calendar, FileText, Heart, Shield, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import io from "socket.io-client"
import { useWeb3 } from "../context/Web3Context"
import SafeDocumentViewer from "./safe-document-viewer"

export default function DoctorDashboard() {
  const { doctorContract, account, disconnect } = useWeb3()
  const router = useRouter()
  
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
  const [socket, setSocket] = useState(null);
  const [patientWallet, setPatientWallet] = useState("")
  const [documentId, setDocumentId] = useState("")
  const [requestMessage, setRequestMessage] = useState("")
  const [status, setStatus] = useState("")
  const [accessDocs, setAccessDocs] = useState([])
  const [viewingDoc, setViewingDoc] = useState(null)

  // --- Fetch doctor's patients from contract ---
  const fetchPatients = async () => {
    if (!doctorContract) return;
    try {
      const result = await doctorContract.getDoctorPatients()
      setPatients(Array.from(result)) 
      console.log(Array.from(result))
    } catch (err) {
      console.error("Failed to fetch patients:", err)
    }
  }

  const fetchAccessList = async () => {
    if (!doctorContract) return;
    try {
      const result = await doctorContract.getAccessList();
      // Result is array of structs. Map to usable format.
      // Ethers returns Result objects which are array-like.
      const docs = result.map(doc => ({
        patient: doc.patient || doc[0],
        ipfsHash: doc.ipfsHash || doc[1],
        hasAccess: doc.hasAccess || doc[2]
      })).filter(doc => doc.hasAccess); // Only show if access is true
      setAccessDocs(docs);
    } catch (err) {
      console.error("Failed to fetch access list:", err);
    }
  }

  useEffect(() => {
    fetchPatients()
    fetchAccessList()
  }, [doctorContract, account])

  // --- Handle patient addition ---
  const handleAddPatient = async (e) => {
    e.preventDefault()
    if (!patientIdToAdd.trim()) return

    try {
      setStatus("Adding patient...")
      const tx = await doctorContract.addPatient(patientIdToAdd)
      await tx.wait()
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
      const tx = await doctorContract.requestAccess(patientWallet, documentId)
      await tx.wait()
      setRequestMessage("Access request sent successfully ✅")
    } catch (error) {
      console.error("Access request failed:", error)
      setRequestMessage("Failed to send access request ❌")
    }
  }

  // --- Listen to AccessRequested events ---
  useEffect(() => {
    if (!doctorContract) return

    const handleAccessRequested = (patient, doctor, ipfsHash) => {
        if (doctor.toLowerCase() === account.toLowerCase()) {
          console.log(`Access requested for document ${ipfsHash} from patient ${patient}`)
        }
    }

    doctorContract.on("AccessRequested", handleAccessRequested);

    return () => {
        doctorContract.off("AccessRequested", handleAccessRequested);
    }
  }, [doctorContract, account])

  const handleLogout = () => {
      disconnect();
      router.push("/");
  }

  const [myDoctorId, setMyDoctorId] = useState(null)

  useEffect(() => {
    const fetchMyId = async () => {
       if (doctorContract && account) {
           try {
             const id = await doctorContract.walletToDoctorId(account)
             setMyDoctorId(id.toString())
           } catch(e) { console.error("Error fetching doctor ID", e) }
       }
    }
    fetchMyId()
  }, [doctorContract, account])

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
    if (selectedPatient && myDoctorId && socket) {
      const roomId = `${selectedPatient}_${myDoctorId}`;
      socket.emit("join_room", roomId);
      setMessages([]); // Clear previous chat
    }
  }, [selectedPatient, myDoctorId, socket]);

  // --- Send chat message ---
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatient || !myDoctorId || !socket) return;
    
    const roomId = `${selectedPatient}_${myDoctorId}`;
    const messageData = {
      room: roomId,
      content: newMessage, // Doctor dashboard uses 'content' not 'message', let's check UI rendering. 
                           // UI uses msg.content. Patient uses msg.message.
                           // I should normalize or respect existing. 
                           // Patient Dashboard UI uses msg.message? 
                           // Let's check PatientDashboard logic in Step 852. 
                           // PatientDashboard UI: msg.message.
                           // DoctorDashboard UI: msg.content.
                           // I'll stick to 'content' for DoctorDashboard to avoid UI breaking, 
                           // BUT if they talk to each other, naming must be consistent or UI must handle both.
                           // User asked to replace logic. 
                           // Better to normalize? NO, risky. 
                           // I will send BOTH fields 'message' and 'content' or just use what UI expects.
                           // Doctor sends 'content'. Patient receives 'data'. Patient UI reads 'msg.message'.
                           // If Doctor sends 'content', Patient sees undefined? 
                           // Correct. I must normalize.
                           // I will change DoctorDashboard to send 'message' AND 'content' for compatibility or just switch to 'message'.
                           // Check Doctor UI rendering: line 266 `msg.content`.
                           // Check Patient UI rendering: line 443 `msg.message`.
                           // I will send BOTH to be safe.
      sender: account,
      message: newMessage, // For Patient Dashboard compatibility
      content: newMessage, // For Doctor Dashboard compatibility
      timestamp: new Date().toISOString(),
    };

    await socket.emit("send_message", messageData);
    setMessages((list) => [...list, messageData]);
    setNewMessage("");
  };

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
              <Button onClick={handleLogout} variant="outline" className="text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2"><Activity className="h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2"><Users className="h-4 w-4" />Patients</TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2"><Calendar className="h-4 w-4" />Appointments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2"><FileText className="h-4 w-4" />Documents</TabsTrigger>
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

          {/* --- Documents --- */}
          <TabsContent value="documents">
            <Card>
              <CardHeader><CardTitle>Authorized Medical Records</CardTitle></CardHeader>
              <CardContent>
                {viewingDoc ? (
                   <SafeDocumentViewer 
                      ipfsHash={viewingDoc.ipfsHash} 
                      patientAddress={viewingDoc.patient}
                      onClose={() => setViewingDoc(null)}
                   />
                ) : (
                    <div>
                        {accessDocs.length === 0 ? (
                            <p className="text-gray-500">No authorized documents found.</p>
                        ) : (
                            <div className="grid gap-4">
                                {accessDocs.map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 bg-white">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-100 p-2 rounded text-blue-600">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Medical Record #{i+1}</p>
                                                <p className="text-sm text-gray-500">Patient: {doc.patient}</p>
                                                <p className="text-xs text-gray-400">ID: {doc.ipfsHash}</p>
                                            </div>
                                        </div>
                                        <Button onClick={() => setViewingDoc(doc)} variant="outline">
                                            View Securely
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
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

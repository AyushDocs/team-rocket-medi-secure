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
  const { doctorContract, patientContract, account, disconnect } = useWeb3()
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

  // New states for selection
  const [requestStatus, setRequestStatus] = useState("")
  const [selectedRequestPatient, setSelectedRequestPatient] = useState(null) // Object: { id, name, walletAddress, records }
  const [selectedRequestDoc, setSelectedRequestDoc] = useState(null) // Object: { hash, fileName }

  // --- Fetch doctor's patients from contract ---
  const fetchPatients = async () => {
    if (!doctorContract || !patientContract) return;
    try {
      const patientIds = await doctorContract.getDoctorPatients()
      
      const patientDataPromises = Array.from(patientIds).map(async (id) => {
          try {
             const details = await patientContract.getPatientDetails(id)
             // Assuming PatientDetails struct now includes walletAddress
             return {
               id: id.toString(),
               name: details.name,
               walletAddress: details.walletAddress, // Assuming this field exists in PatientDetails
               records: details.medicalRecords.map(record => ({
                 hash: record.ipfsHash,
                 fileName: record.fileName
               }))
             }
          } catch(e) { 
            console.error(`Error fetching details for patient ID ${id}:`, e); 
            return null; 
          }
      });
      
      const allPatients = await Promise.all(patientDataPromises);
      setPatients(allPatients.filter(p => p !== null));
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
    if (!selectedRequestPatient || !selectedRequestDoc) return
    try {
      const tx = await doctorContract.requestAccess(
          selectedRequestPatient.walletAddress, 
          selectedRequestDoc.hash, 
          selectedRequestDoc.fileName
      )
      await tx.wait()
      setRequestMessage("Access request sent successfully ✅")
    } catch (error) {
      console.error("Access request failed:", error)
      setRequestMessage("Failed to send access request ❌")
    }
  }

  // ... (keep useEffect for event listener)

  // ... (keep login/socket logic)

  // ... 

          {/* --- Patients --- */}
          <TabsContent value="patients">
            <Card>
              <CardHeader><CardTitle>Request Patient Data Access</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Patient</label>
                    <select
                      className="w-full p-2 border rounded"
                      onChange={(e) => {
                          const p = patients.find(p => p.id === e.target.value);
                          setSelectedRequestPatient(p);
                          setSelectedRequestDoc(null);
                      }}
                      value={selectedRequestPatient?.id || ""}
                    >
                      <option value="">-- Select Patient --</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                      ))}
                    </select>
                </div>

                {selectedRequestPatient && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Document</label>
                        <select
                          className="w-full p-2 border rounded"
                          onChange={(e) => {
                              const doc = selectedRequestPatient.records.find(r => r.hash === e.target.value);
                              setSelectedRequestDoc(doc);
                          }}
                          value={selectedRequestDoc?.hash || ""}
                        >
                          <option value="">-- Select Document --</option>
                          {selectedRequestPatient.records.length === 0 ? (
                              <option disabled>No documents available</option>
                          ) : (
                              selectedRequestPatient.records.map((doc, i) => (
                                <option key={i} value={doc.hash}>{doc.fileName} (Hash: {doc.hash.slice(0,6)}...)</option>
                              ))
                          )}
                        </select>
                    </div>
                )}
                
                <Button 
                    onClick={requestAccess} 
                    className="w-full bg-[#703FA1] hover:bg-[#5a2f81]"
                    disabled={!selectedRequestPatient || !selectedRequestDoc}
                >
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
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
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

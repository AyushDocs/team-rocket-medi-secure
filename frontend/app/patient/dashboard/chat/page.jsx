"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import io from "socket.io-client"
import { useWeb3 } from "../../../../context/Web3Context"

export default function ChatPatient() {
  const { patientContract, doctorContract, account } = useWeb3()
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [myPatientId, setMyPatientId] = useState(null)

  useEffect(() => {
    const fetchPatientId = async () => {
        if (!patientContract || !account) return;
        try {
            const patientId = await patientContract.walletToPatientId(account)
            if (patientId.toString() !== "0") {
                setMyPatientId(patientId.toString())
            }
        } catch(e) { console.error("Error fetching patient ID", e) }
    }
    fetchPatientId()
  }, [patientContract, account])

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
    console.log(roomId)
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

  return (
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
            {doctors.map((doctor, index) => {
              const docId =doctor.doctorId.toString()
              return (
                <option key={index} value={docId}>
                  {doctor.name || doctor[1]} - {doctor.specialization || doctor[2]} (ID: {docId})
                </option>
              )
            })}
          </select>
        </div>

        {selectedDoctor && (
          <div>
            <div className="chat-window border p-4 h-64 overflow-y-auto bg-gray-100 rounded mb-4">
              {messages.map((msg, index) => (
                <div key={index} className={`mb-2 p-2 rounded ${msg.sender === account ? "bg-blue-200 ml-auto w-fit" : "bg-white w-fit"}`}>
                  <p>{msg.message || msg.content}</p>
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
  )
}

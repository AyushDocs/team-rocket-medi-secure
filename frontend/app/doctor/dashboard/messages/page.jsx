"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import io from "socket.io-client"
import { useWeb3 } from "../../../../context/Web3Context"

export default function MessagesDoctor() {
  const { doctorContract, account } = useWeb3()
  
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [patients, setPatients] = useState([])
  const [socket, setSocket] = useState(null);
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

  const fetchPatients = async () => {
    if (!doctorContract) return;
    try {
      const result = await doctorContract.getDoctorPatients()
      setPatients(Array.from(result)) 
    } catch (err) {
      console.error("Failed to fetch patients:", err)
    }
  }

  useEffect(() => {
    fetchPatients()
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
    if (selectedPatientId && myDoctorId && socket) {
      const roomId = `${selectedPatientId}_${myDoctorId}`;
      socket.emit("join_room", roomId);
      setMessages([]); // Clear previous chat
    }
  }, [selectedPatientId, myDoctorId, socket]);

  // --- Send chat message ---
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatientId || !myDoctorId || !socket) return;
    
    const roomId = `${selectedPatientId}_${myDoctorId}`;
    console.log(roomId)
    const messageData = {
      room: roomId,
      content: newMessage, 
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
      <CardHeader><CardTitle>Secure Chat</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select patient</option>
            {patients.map((id, i) => (
              <option key={i} value={id.toString()}>{`Patient ${id.toString()}`}</option>
            ))}
          </select>

          <div className="border p-3 h-64 overflow-y-auto bg-white rounded">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 mb-2 rounded-lg ${
                  msg.sender === account ? "bg-blue-100 text-right" : "bg-gray-100"
                }`}
              >
                <p className="text-sm">{msg.content || msg.message}</p>
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
  )
}

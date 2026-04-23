"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
    ChevronRight, 
    Lock, 
    MessageSquare, 
    MoreVertical, 
    Phone, 
    Search, 
    Send, 
    ShieldCheck, 
    User, 
    Video 
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
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
  const chatEndRef = useRef(null)

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
      setMessages([]); 
    }
  }, [selectedPatientId, myDoctorId, socket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPatientId || !myDoctorId || !socket) return;
    
    const roomId = `${selectedPatientId}_${myDoctorId}`;
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
    <div className="h-[calc(100vh-200px)] min-h-[600px] animate-in fade-in duration-700 font-outfit">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            
            {/* LEFT: CHAT LIST */}
            <div className="lg:col-span-4 h-full">
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white h-full flex flex-col overflow-hidden">
                    <div className="p-8 pb-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Intelligence</h2>
                            <Badge className="bg-indigo-50 text-indigo-600 border-none font-black">{patients.length}</Badge>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Locate Channel..."
                                className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border-none text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {patients.map((id, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedPatientId(id.toString())}
                                className={`w-full group flex items-center gap-4 p-4 rounded-3xl transition-all border-2 ${
                                    selectedPatientId === id.toString()
                                    ? 'bg-indigo-50 border-indigo-100 shadow-lg shadow-indigo-100/50'
                                    : 'bg-white border-transparent hover:border-slate-50'
                                }`}
                            >
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black transition-colors ${
                                    selectedPatientId === id.toString()
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                                }`}>
                                    P{id.toString().slice(-2)}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className={`font-black text-sm ${selectedPatientId === id.toString() ? 'text-indigo-900' : 'text-slate-800'}`}>
                                        Patient Node {id.toString()}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Secure Channel Active</p>
                                </div>
                                <ChevronRight className={`h-4 w-4 transition-transform ${
                                    selectedPatientId === id.toString() ? 'translate-x-1 text-indigo-400' : 'text-slate-200'
                                }`} />
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

            {/* RIGHT: CHAT INTERFACE */}
            <div className="lg:col-span-8 h-full">
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white h-full flex flex-col overflow-hidden relative">
                    
                    {!selectedPatientId ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center">
                                <MessageSquare className="h-10 w-10 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">No Secure Connection</h3>
                                <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">Initialize a communication node by selecting a patient from the roster.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* CHAT HEADER */}
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white z-10 shadow-sm shadow-slate-100/50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                        <ShieldCheck className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800">Node_{selectedPatientId}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">End-to-End Encrypted</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Video className="h-5 w-5" /></Button>
                                    <Button size="icon" variant="ghost" className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"><Phone className="h-5 w-5" /></Button>
                                    <Button size="icon" variant="ghost" className="rounded-xl text-slate-400"><MoreVertical className="h-5 w-5" /></Button>
                                </div>
                            </div>

                            {/* MESSAGES AREA */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar bg-slate-50/30">
                                {messages.map((msg, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex flex-col ${msg.sender === account ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-3xl p-5 shadow-sm text-sm font-medium leading-relaxed transition-all ${
                                            msg.sender === account 
                                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                                        }`}>
                                            {msg.content || msg.message}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* CHAT INPUT */}
                            <div className="p-8 border-t border-slate-50 bg-white">
                                <div className="flex items-center gap-4 bg-slate-50 p-2 pl-6 rounded-[2rem] border border-slate-100 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Secure message terminal..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                    />
                                    <Button 
                                        onClick={sendMessage}
                                        size="icon" 
                                        className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 shrink-0"
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <Lock className="h-3 w-3 text-slate-300" />
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Quantum-Resistant Communication Socket Active</p>
                                </div>
                            </div>
                        </>
                    )}
                </Card>
            </div>
        </div>
    </div>
  )
}

"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ethers } from "ethers"
import { 
    Eye, 
    Upload, 
    Shield, 
    Calendar, 
    Stethoscope, 
    FileText, 
    MoreVertical, 
    Activity,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Zap,
    Download,
    Maximize2,
    Sparkles,
    MapPin,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Maximize,
    Minimize
} from "lucide-react"
import React, { useEffect, useState, useRef, useCallback } from "react"
import toast from "react-hot-toast"
import { useWeb3 } from "../../../../context/Web3Context"
import { motion, AnimatePresence } from "framer-motion"

// ─── Watermark Overlay ───────────────────────────────────────────────────────
// Draws a repeating diagonal watermark (canvas-based) across the document
// viewer. Sits above all content via pointer-events:none so the document
// remains interactive. The watermark is baked into every screenshot — making
// any unauthorised capture traceable back to the viewing wallet and session.
function WatermarkOverlay({ account }) {
  const canvasRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, W, H);

    const shortAddr = account
      ? `${account.slice(0, 8)}...${account.slice(-6)}`
      : "UNAUTHORISED";
    const ts = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const lines = ["⚕ CONFIDENTIAL – SANJEEVNI", shortAddr, ts];

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 5);
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(99, 102, 241, 0.12)"; // indigo, very faint
    ctx.textAlign = "center";

    const spacingX = 300;
    const spacingY = 100;
    const cols = Math.ceil(W / spacingX) + 2;
    const rows = Math.ceil(H / spacingY) + 2;

    for (let r = -rows; r <= rows; r++) {
      for (let c = -cols; c <= cols; c++) {
        const x = c * spacingX;
        const y = r * spacingY;
        lines.forEach((line, i) => {
          ctx.fillText(line, x, y + i * 16);
        });
      }
    }

    ctx.restore();
  }, [account]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",   // document stays interactive
        zIndex: 10,
        borderRadius: "inherit",
      }}
    />
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function RecordsPatient() {
  const { patientContract, account } = useWeb3()
  const [healthRecords, setHealthRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all")
  
  // Create Ref for File Input
  const fileInputRef = useRef(null);
  
  // Upload State
  const [docName, setDocName] = useState("")
  const [docDate, setDocDate] = useState("")
  const [hospital, setHospital] = useState("")
  const [isEmergency, setIsEmergency] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Document Viewing State
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedDocUrl, setSelectedDocUrl] = useState("")
  const [docHtml, setDocHtml] = useState("")
  const [isImage, setIsImage] = useState(false)
  const [viewingDoc, setViewingDoc] = useState(false)
  const [viewingRecord, setViewingRecord] = useState(null)
  
  // Zoom & Pan State
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const viewerContainerRef = useRef(null)
  const imageRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    fetchRecords()
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [patientContract, account])

  const fetchRecords = async () => {
    if (!patientContract || !account) return;
    try {
      setLoading(true)
      const patientId = await patientContract.walletToPatientId(account)
      if (patientId.toString() === "0") {
           setLoading(false);
           return; 
      }

      const records = await patientContract.getMedicalRecords(patientId)
      const mapped = records.map((record, index) => ({
          recordId: index,
          tokenId: record.tokenId ? record.tokenId.toString() : (record[0] ? record[0].toString() : "N/A"),
          ipfsHash: record.ipfsHash || record[1],
          fileName: record.fileName || record[2],
          date: record.recordDate || record[3] || "Unknown Date",
          hospital: record.hospital || record[4] || "Unknown Location",
          isEmergencyViewable: record.isEmergencyViewable || record[5],
          timestamp: new Date().getTime() - (index * 86400000) // Mock timestamp for sorting
      }))
      
      setHealthRecords(mapped.reverse())
    } catch (err) {
      console.error("Error fetching records:", err)
      setError(err.message)
      toast.error("Failed to load records")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    const currentFile = fileInputRef.current?.files?.[0];

    if(!patientContract || !currentFile || !docName || !docDate || !hospital) {
        toast.error("Please fill all fields and select a file.");
        return;
    }
    
    setUploading(true);
    const toastId = toast.loading("Encrypting and Uploading...");

    try {
        const formData = new FormData();
        formData.append("file", currentFile); 
        formData.append("userAddress", account); 
  
        const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";
        const response = await fetch(`${baseUrl}/api/v1/files`, {
            method: "POST",
            body: formData,
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to upload file");
        }
  
        const result = await response.json();
        const ipfsHash = result.data?.ipfsHash || result.ipfsHash;
        
        toast.loading("Minting Immutable NFT...", { id: toastId });
        const tx = await patientContract.addMedicalRecord(ipfsHash, docName, docDate, hospital, isEmergency);
        await tx.wait();
        
        toast.success("Health Record Secured on Chain!", { id: toastId });
        setShowUploadModal(false);
        fetchRecords();
        // Reset form
        setDocName(""); setHospital(""); setIsEmergency(false);
    } catch(e) {
        toast.error(`Error: ${e.message}`, { id: toastId });
    } finally {
        setUploading(false);
    }
  }

  const handleToggleEmergency = async (record) => {
    try {
        const toastId = toast.loading("Updating visibility...");
        const tx = await patientContract.toggleEmergencyVisibility(record.recordId);
        await tx.wait();
        toast.success("Emergency access status updated", { id: toastId });
        fetchRecords();
    } catch (err) {
        toast.error("Failed to update visibility");
    }
  }

  const handleViewDocument = async (record) => {
      try {
          setViewingDoc(true);
          setViewingRecord(record);
          setDocHtml("");
          setSelectedDocUrl("");
          setScale(1);
          setPosition({ x: 0, y: 0 });
          
          if (!window.ethereum) throw new Error("Wallet not found");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const signature = await signer.signMessage(record.ipfsHash);

          const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";
          const response = await fetch(`${baseUrl}/api/v1/files/${record.ipfsHash}?userAddress=${account}&signature=${signature}&patientAddress=${account}`);
          
          if (!response.ok) throw new Error("Decryption failed");

          const blob = await response.blob();
          const type = blob.type;
          setIsImage(type.startsWith("image/"));
          
          if(type.includes("wordprocessingml") || type.includes("docx")) {
             const mammoth = await import("mammoth")
             const arrayBuffer = await blob.arrayBuffer();
             const result = await mammoth.convertToHtml({ arrayBuffer });
             setDocHtml(result.value);
          } 
          else if (type.startsWith("text/")) {
             const text = await blob.text();
             setDocHtml(`<pre className="whitespace-pre-wrap">${text}</pre>`);
          }
          else {
             const url = URL.createObjectURL(blob);
             setSelectedDocUrl(url);
          }
          
          setViewModalOpen(true);
      } catch (err) {
          toast.error("Failed to view document: " + err.message);
      } finally {
          setViewingDoc(false);
      }
  };

  const handleZoom = (delta) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5))
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleMouseDown = (e) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      handleZoom(delta)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Medical Vault <Sparkles className="text-indigo-600 h-8 w-8" />
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Secure, encrypted medical NFTs stored on the permanent web.
          </p>
        </div>
        
        <Button 
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-7 px-8 rounded-2xl shadow-xl shadow-indigo-100 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} />
          Secure New Record
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Artifacts", value: healthRecords.length, icon: FileText, color: "indigo" },
          { label: "Network Status", value: "Syncing", icon: Activity, color: "emerald", labelIcon: <CheckCircle2 size={12}/> },
          { label: "Storage Used", value: "2.4 MB", icon: Shield, color: "amber" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden bg-white group">
            <CardContent className="p-6 flex items-center gap-5">
              <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                  {stat.label} {stat.labelIcon}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Tabs and Filters */}
        <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
            {["all", "emergency", "recent"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
        </div>

        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-[2.5rem] border-none shadow-sm animate-pulse">
                        <div className="flex justify-between mb-4">
                            <Skeleton className="h-6 w-1/2 rounded-lg" />
                            <Skeleton className="h-6 w-1/4 rounded-lg" />
                        </div>
                        <Skeleton className="h-20 w-full rounded-2xl mb-4" />
                        <div className="flex gap-2">
                             <Skeleton className="h-10 grow rounded-xl" />
                             <Skeleton className="h-10 w-10 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        ) : healthRecords.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center shadow-sm border border-slate-50">
            <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Upload className="text-indigo-400 h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Vault is Empty</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">
              Start by securing your first medical record on the blockchain.
            </p>
            <Button 
                onClick={() => setShowUploadModal(true)}
                variant="outline" 
                className="mt-8 border-2 border-indigo-600 text-indigo-600 font-black px-8 py-6 rounded-2xl hover:bg-indigo-600 hover:text-white"
            >
                Initialize First Upload
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthRecords.map((record, idx) => (
              <motion.div
                key={record.tokenId}
                layoutId={`record-${record.tokenId}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2.5rem] overflow-hidden bg-white group h-full flex flex-col">
                  <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <FileText size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-3 py-1.5 rounded-full">
                        NFT #{record.tokenId}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 line-clamp-1">
                        {record.fileName}
                    </h3>
                    
                    <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Calendar size={14} className="text-indigo-400" />
                            <span className="text-xs font-bold">{record.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                            <MapPin size={14} className="text-indigo-400" />
                            <span className="text-xs font-bold truncate">{record.hospital}</span>
                        </div>
                    </div>

                    <div className={`p-4 rounded-3xl mb-4 flex items-center justify-between ${record.isEmergencyViewable ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${record.isEmergencyViewable ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                <Zap size={14} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Emergency Access</p>
                                <p className={`text-xs font-black ${record.isEmergencyViewable ? 'text-rose-600' : 'text-slate-600'}`}>
                                    {record.isEmergencyViewable ? 'ENABLED' : 'DISABLED'}
                                </p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleToggleEmergency(record)}
                            variant="ghost" 
                            size="icon" 
                            className="rounded-xl hover:bg-white hover:shadow-sm"
                        >
                            <MoreVertical size={16} />
                        </Button>
                    </div>
                  </div>

                  <div className="px-8 pb-8 pt-0">
                    <Button 
                      onClick={() => handleViewDocument(record)}
                      disabled={viewingDoc}
                      className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-7 rounded-2xl transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-100"
                    >
                      {viewingDoc && viewingRecord?.tokenId === record.tokenId ? (
                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Maximize2 size={18} />
                      )}
                      View Internal Asset
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white">
          <div className="bg-indigo-600 p-12 text-white relative">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Zap size={120}/></div>
            <h3 className="text-4xl font-black tracking-tight relative z-10">Secure Artifact</h3>
            <p className="text-indigo-100 font-medium mt-2 relative z-10 max-w-sm">Every upload is end-to-end encrypted and minted as a unique NFT on the MediSecure registry.</p>
          </div>
          
          <div className="p-12 space-y-8">
            <form onSubmit={handleUpload} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Asset Reference</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Brain MRI Scan" 
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition-all font-bold text-slate-900 outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Issuing Facility</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Mayo Clinic" 
                            value={hospital}
                            onChange={(e) => setHospital(e.target.value)}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition-all font-bold text-slate-900 outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Capture Date</label>
                        <input 
                            type="datetime-local" 
                            value={docDate}
                            onChange={(e) => setDocDate(e.target.value)}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition-all font-bold text-slate-900 outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Payload Source</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full p-4 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-indigo-100 transition-all"
                        >
                            <Upload size={18} className="text-indigo-600" />
                            <span className="text-xs font-black text-indigo-900 truncate">
                                {fileInputRef.current?.files?.[0]?.name || "Select PDF/Image Artifact"}
                            </span>
                            <input 
                                type="file"
                                ref={fileInputRef}
                                onChange={() => {/* Force re-render for file name */}}
                                className="hidden"
                                accept="application/pdf,image/*,.docx"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-rose-50 p-6 rounded-3xl border border-rose-100 group cursor-pointer" onClick={() => setIsEmergency(!isEmergency)}>
                    <div className={`p-4 rounded-2xl transition-all ${isEmergency ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-600 group-hover:bg-rose-200'}`}>
                        <Zap size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase">Emergency Bypass Protocol</h4>
                        <p className="text-xs text-rose-500 font-medium">Permit life-saving access without manual consent during emergencies.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-all ${isEmergency ? 'bg-rose-600' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${isEmergency ? 'ml-6' : 'ml-0'}`} />
                    </div>
                </div>

                <Button 
                    type="submit" 
                    disabled={uploading} 
                    className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-black py-8 rounded-[2rem] shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-3"
                >
                    {uploading ? (
                        <>
                            <div className="h-5 w-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>Processing Blockchain Ledger...</span>
                        </>
                    ) : (
                        <>
                            <Plus size={24} />
                            <span>Initialize NFT Minting</span>
                        </>
                    )}
                </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Viewer Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] rounded-[3rem] p-0 overflow-hidden border-none shadow-4xl bg-white flex flex-col">
            <div className="p-8 border-b flex items-center justify-between gap-4 bg-slate-50">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white rounded-2xl shadow-sm"><FileText className="text-indigo-600" /></div>
                    <div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                            {viewingRecord?.fileName}
                        </DialogTitle>
                        <p className="text-xs font-bold text-slate-400">NFT Ledger ID: {viewingRecord?.tokenId} • Decrypted Securely</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 mr-2">
                        {isImage && (
                            <>
                                 <Button onClick={() => handleZoom(-0.2)} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100">
                                    <ZoomOut size={16} />
                                 </Button>
                                 <div className="px-2 text-[10px] font-black w-12 text-center text-slate-500">
                                    {Math.round(scale * 100)}%
                                 </div>
                                 <Button onClick={() => handleZoom(0.2)} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100">
                                    <ZoomIn size={16} />
                                 </Button>
                                 <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                                 <Button onClick={resetZoom} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100">
                                    <RotateCcw size={16} />
                                 </Button>
                                 <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                            </>
                        )}
                         <Button onClick={toggleFullscreen} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-100">
                            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                         </Button>
                    </div>
                    <Button onClick={() => setViewModalOpen(false)} className="rounded-xl bg-slate-900 font-black text-xs h-12 px-6 text-white">
                        Close
                    </Button>
                </div>
            </div>
            
            <div 
                className={`flex-1 ${isFullscreen ? 'bg-black' : 'bg-slate-100/50'} p-8 overflow-hidden relative`}
                ref={viewerContainerRef}
            >
                <div 
                    className={`w-full h-full bg-white rounded-[2rem] shadow-inner overflow-hidden border border-slate-100 flex items-center justify-center relative touch-none ${isDragging ? 'cursor-grabbing' : (scale > 1 ? 'cursor-grab' : '')}`}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {docHtml ? (
                         <div className="w-full h-full overflow-auto p-12 prose prose-indigo max-w-none prose-headings:font-black prose-p:font-medium prose-p:text-slate-600 font-inter">
                            <div dangerouslySetInnerHTML={{ __html: docHtml }} />
                         </div>
                    ) : isImage ? (
                        <div 
                            className="w-full h-full flex items-center justify-center p-4 bg-slate-100/30 relative"
                            style={{ userSelect: "none", WebkitUserSelect: "none" }}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            <img 
                                ref={imageRef}
                                src={selectedDocUrl} 
                                className="max-w-full max-h-full object-contain rounded-[1.5rem] shadow-2xl bg-white shadow-indigo-100/50 transition-transform duration-75 ease-out select-none" 
                                alt="Medical Asset"
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                                draggable={false}
                                style={{ 
                                    userSelect: "none", 
                                    WebkitUserSelect: "none", 
                                    pointerEvents: "none",
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    transformOrigin: "center"
                                }}
                            />
                            {/* Transparent interaction blocker */}
                            <div 
                                className="absolute inset-4 rounded-[1.5rem] z-[5]"
                                style={{ pointerEvents: "all" }}
                                onContextMenu={(e) => e.preventDefault()}
                                onDragStart={(e) => e.preventDefault()}
                            />
                        </div>
                    ) : selectedDocUrl ? (
                         <iframe 
                            src={selectedDocUrl} 
                            className="w-full h-full rounded-[2rem]" 
                            title="SafeView"
                         />
                    ) : (
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <Skeleton className="h-[70vh] w-[800px] rounded-[2rem]" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="font-black text-indigo-600 uppercase tracking-widest text-sm">Decryption in Progress</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Dynamic Watermark Overlay ── */}
                    {/* Renders wallet address + timestamp diagonally across the entire viewer.
                        Even if a screenshot is taken, the watermark persists, making
                        unauthorized sharing traceable back to this specific viewer session. */}
                    <WatermarkOverlay account={account} />
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

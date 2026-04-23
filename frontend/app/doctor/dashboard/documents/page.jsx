"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    Clock, 
    ExternalLink, 
    FileText, 
    History, 
    Lock, 
    Search, 
    ShieldAlert, 
    ShieldCheck, 
    Unlock 
} from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import SafeDocumentViewer from "../../../../components/safe-document-viewer"
import { useWeb3 } from "../../../../context/Web3Context"

export default function DocumentsDoctor() {
  const { doctorContract, account } = useWeb3()
  const [accessDocs, setAccessDocs] = useState([])
  const [viewingDoc, setViewingDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAccessList = async () => {
    if (!doctorContract) return;
    try {
      setLoading(true)
      const result = await doctorContract.getAccessList();
      const docs = result.map(doc => {
        const grantTime = Number(doc.grantTime || 0);
        const duration = Number(doc.duration || 0);
        const now = Math.floor(Date.now() / 1000);
        const isExpired = (grantTime + duration) < now;
        const remaining = (grantTime + duration) - now;
        
        return {
            patient: doc.patient,
            ipfsHash: doc.ipfsHash,
            fileName: doc.fileName || `Document`,
            hasAccess: doc.hasAccess,
            grantTime,
            duration,
            isExpired,
            remaining
        };
      }).filter(doc => doc.hasAccess).reverse();
      
      setAccessDocs(docs);
    } catch (err) {
      console.error("Failed to fetch access list:", err);
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccessList()
  }, [doctorContract, account])

  const formatRemaining = (sec) => {
      if(sec <= 0) return "Expired";
      if(sec < 3600) return `${Math.floor(sec/60)}m remaining`;
      if(sec < 86400) return `${(sec/3600).toFixed(1)}h remaining`;
      return `${(sec/86400).toFixed(1)}d remaining`;
  }

  if (viewingDoc) {
      return (
          <div className="animate-in fade-in duration-500 font-outfit">
              <div className="mb-6 flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-50 rounded-2xl">
                        <Lock className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                          <h2 className="text-xl font-black text-slate-800">{viewingDoc.fileName}</h2>
                          <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Decrypted Secure Session Active</p>
                      </div>
                  </div>
                  <Button 
                    onClick={() => setViewingDoc(null)} 
                    variant="outline" 
                    className="rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                  >
                      Terminate View
                  </Button>
              </div>
              <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[800px]">
                <SafeDocumentViewer 
                    ipfsHash={viewingDoc.ipfsHash} 
                    patientAddress={viewingDoc.patient}
                    onClose={() => setViewingDoc(null)}
                />
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-outfit">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Clinical Vault</h1>
                <p className="text-slate-500 font-medium text-lg">Your authorized portal to immutable patient dossiers.</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-600 border border-emerald-100">
                    <History className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Session Logic: T-Level 3</span>
                </div>
                <Button 
                    onClick={fetchAccessList}
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all font-bold"
                >
                    <History className="h-5 w-5" />
                </Button>
            </div>
        </div>

        {/* VAULT INTERFACE */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
            <CardHeader className="p-10 pb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <CardTitle className="text-2xl font-black text-slate-800">Authorized Dossiers</CardTitle>
                        <CardDescription className="text-lg font-medium mt-1">Temporary medical node access keys.</CardDescription>
                    </div>
                    <div className="relative w-full md:w-[340px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Locate Dossier..."
                            className="w-full h-14 pl-12 pr-4 bg-slate-50 rounded-2xl border-none text-xs font-bold focus:ring-4 focus:ring-indigo-50 transition-all outline-none shadow-inner"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-10 pt-6">
               {loading ? (
                   <div className="space-y-4">
                       {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
                   </div>
               ) : accessDocs.length === 0 ? (
                   <div className="py-24 text-center space-y-6 bg-slate-50/50 rounded-[3rem] border-4 border-dashed border-slate-100">
                        <div className="h-24 w-24 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto">
                            <Lock className="h-10 w-10 text-slate-200" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Clinical Vault Empty</p>
                            <p className="text-slate-300 text-sm mt-2 max-w-xs mx-auto">Authorized records will appear here after patient approval or emergency override.</p>
                        </div>
                   </div>
               ) : (
                   <div className="grid grid-cols-1 gap-4">
                       {accessDocs.map((doc, i) => (
                           <div 
                                key={i} 
                                className={`group relative flex flex-col sm:flex-row items-center justify-between p-6 rounded-[2.2rem] border-2 transition-all duration-300 ${
                                    doc.isExpired 
                                    ? 'bg-slate-50 border-transparent opacity-60' 
                                    : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/40 hover:-translate-y-1'
                                }`}
                           >
                               <div className="flex items-center gap-6 mb-4 sm:mb-0 w-full sm:w-auto">
                                   <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${
                                       doc.isExpired ? 'bg-slate-200 text-slate-400' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                   }`}>
                                       <FileText className="h-7 w-7" />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-3 mb-1">
                                            <p className="font-black text-slate-800 text-lg leading-tight truncate max-w-[200px]">{doc.fileName}</p>
                                            {doc.isExpired ? (
                                                <Badge variant="outline" className="text-[9px] font-black uppercase text-rose-500 border-rose-200 bg-rose-50">Lapsed</Badge>
                                            ) : (
                                                <Badge className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border-none">Active Session</Badge>
                                            )}
                                       </div>
                                       <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                           <div className="flex items-center gap-1 font-mono">
                                               <History className="h-3 w-3" /> {doc.patient.slice(0, 10)}...{doc.patient.slice(-4)}
                                           </div>
                                           <div className={`flex items-center gap-1 ${doc.isExpired ? 'text-rose-400' : 'text-emerald-500'}`}>
                                               <Clock className="h-3 w-3" /> {formatRemaining(doc.remaining)}
                                           </div>
                                       </div>
                                   </div>
                               </div>

                               <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <Button 
                                        onClick={() => setViewingDoc(doc)}
                                        disabled={doc.isExpired}
                                        className={`flex-1 sm:flex-none h-14 px-8 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 ${
                                            doc.isExpired 
                                            ? 'bg-slate-100 text-slate-400 border-none' 
                                            : 'bg-slate-900 hover:bg-black text-white'
                                        }`}
                                    >
                                        {doc.isExpired ? (
                                            <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> ACCESS EXPIRED</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><Unlock className="h-4 w-4" /> SECURE VIEW</span>
                                        )}
                                    </Button>
                               </div>
                               
                               {!doc.isExpired && (
                                   <div className="absolute top-2 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                                       <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                   </div>
                               )}
                           </div>
                       ))}
                   </div>
               )}
            </CardContent>
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        </Card>

        {/* SECURITY ADVISORY */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 flex flex-col md:flex-row items-center gap-8 group">
            <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <ShieldAlert className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-black text-slate-800">Protocol Compliance Required</h3>
                <p className="text-slate-500 font-medium">Any unauthorized retention or unauthorized duplication of clinical dossiers via screenshots or local caching is a terminal violation of the Sanjeevni Protocol.</p>
            </div>
            <Link href="/doctor/dashboard/audit-handbook">
                <Button variant="outline" className="h-12 rounded-xl text-xs font-black uppercase tracking-widest border-slate-200">
                    Audit Handbook
                </Button>
            </Link>
        </div>

    </div>
  )
}

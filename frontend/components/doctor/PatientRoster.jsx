"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, ChevronLeft, ChevronRight, Users } from "lucide-react"

export default function PatientRoster({ 
    patientsList, 
    currentPage, 
    setCurrentPage, 
    itemsPerPage 
}) {
    const totalPages = Math.ceil(patientsList.length / itemsPerPage)
    const currentPatients = patientsList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white">
            <CardHeader className="p-8">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                        <Stethoscope className="h-6 w-6 text-indigo-600" />
                        Patient Roster
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-xs font-black text-slate-400 px-2 uppercase tracking-widest">PG {currentPage} / {totalPages || 1}</span>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-0">
                {patientsList.length === 0 ? (
                    <div className="py-20 text-center space-y-4 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <Users className="h-10 w-10 text-slate-200 mx-auto" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No linked patients in your network.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {currentPatients.map((p) => (
                            <div key={p.id} className="group flex justify-between items-center p-5 bg-slate-50/50 hover:bg-indigo-50/50 rounded-3xl border border-transparent hover:border-indigo-100 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 font-black group-hover:text-indigo-600 transition-colors">
                                        {p.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 text-lg leading-tight">{p.name}</p>
                                        <p className="text-xs font-mono text-slate-400 mt-0.5">{p.wallet.slice(0, 10)}...{p.wallet.slice(-6)}</p>
                                    </div>
                                </div>
                                <Badge className="bg-indigo-100 text-indigo-600 border-none font-black text-[10px] tracking-widest px-3 py-1 rounded-lg">
                                    @{p.username}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

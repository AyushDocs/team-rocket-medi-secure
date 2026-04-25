"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, LayoutDashboard } from "lucide-react"

export default function EstablishLink({ 
    patientIdToAdd, 
    setPatientIdToAdd, 
    handleAddPatient, 
    status 
}) {
    return (
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-indigo-100 bg-white overflow-hidden group">
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                     <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 transition-colors duration-500">
                        <UserPlus className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                     </div>
                     <LayoutDashboard className="h-5 w-5 text-indigo-100" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-800">Establish Link</CardTitle>
                <CardDescription className="text-slate-500 font-medium">Link a new patient ID to your medical node.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                <form onSubmit={handleAddPatient} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 ml-1">Patient Identity Token</label>
                        <input
                            type="text"
                            value={patientIdToAdd}
                            onChange={(e) => setPatientIdToAdd(e.target.value)}
                            placeholder="Username or Wallet Address"
                            className="w-full h-14 px-6 rounded-2xl border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 focus:bg-white focus:border-indigo-400 transition-all font-bold text-slate-700 outline-none shadow-inner"
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 transition-all active:scale-95">
                         {status ? (
                             <span className="flex items-center gap-2"><div className="animate-spin h-3 w-3 border-2 border-white rounded-full border-t-transparent" /> {status}</span>
                         ) : "Authorize Medical Connection"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCcw } from "lucide-react"

export default function NodeRegistry({ 
    doctors, 
    newDoctorAddr, 
    setNewDoctorAddr, 
    handleAddDoctor, 
    adding, 
    fetchData 
}) {
    return (
        <Card className="lg:col-span-12 xl:col-span-5 rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-slate-50">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <CardTitle className="text-xl font-black text-slate-800">Node Registry</CardTitle>
                        <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized Medical Personnel</CardDescription>
                    </div>
                    <Button 
                        onClick={fetchData}
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                     <Input 
                        placeholder="0x Doctor Node Address" 
                        value={newDoctorAddr}
                        onChange={(e) => setNewDoctorAddr(e.target.value)}
                        className="bg-transparent border-none focus-visible:ring-0 font-mono text-xs font-bold"
                     />
                     <Button 
                        onClick={handleAddDoctor} 
                        disabled={adding}
                        className="h-12 px-6 rounded-[1.2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-200 transition-all active:scale-95"
                     >
                        {adding ? "Broadcasting..." : "Authorize"}
                     </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-50">
                                <TableHead className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Protocol Address</TableHead>
                                <TableHead className="px-10 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Verification</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doctors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs">Registry Empty</TableCell>
                                </TableRow>
                            ) : (
                                doctors.map((doc, i) => (
                                    <TableRow key={i} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center font-black text-xs text-slate-400 border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                    {i + 1}
                                                </div>
                                                <span className="font-mono text-xs font-bold text-slate-600">{doc}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-10 py-6 text-right">
                                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] px-3 py-1 uppercase tracking-tighter">Verified Node</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function CareTeam({ doctorsList }) {
    return (
        <Card className="card-premium p-4">
            <CardHeader>
                <CardTitle className="text-xl font-black">Care Team</CardTitle>
                <p className="text-xs text-slate-400 font-bold">Professionals with active consent</p>
            </CardHeader>
            <CardContent>
                {doctorsList.length === 0 ? <p className="text-gray-500 py-10 text-center italic">No care providers linked.</p> : (
                    <div className="space-y-4">
                        {doctorsList.map((doc, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all bg-gradient-to-br from-white to-slate-50/50">
                                <div className="h-14 w-14 bg-emerald-100 rounded-[1.2rem] flex items-center justify-center text-emerald-700 shadow-inner">
                                    <User className="h-7 w-7"/>
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-800 tracking-tight leading-tight">{doc.name}</p>
                                    <p className="text-xs text-slate-400 font-bold mt-0.5">{doc.specialization}</p>
                                    <Badge variant="outline" className="mt-2 text-[8px] h-4 font-black border-emerald-100 text-emerald-600 uppercase bg-emerald-50">Authorized</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

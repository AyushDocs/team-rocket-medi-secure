"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
    Calendar, 
    CalendarCheck, 
    Clock, 
    MoreVertical, 
    Phone, 
    Stethoscope, 
    User, 
    Video 
} from "lucide-react"
import { useState } from "react"

export default function AppointmentsDoctor() {
  const [appointments] = useState([
    { id: 1, patient: "Sarah Johnson", time: "09:00 AM", date: "Today", type: "Post-Op Follow-up", status: "confirmed", priority: "high" },
    { id: 2, patient: "Michael Chen", time: "10:30 AM", date: "Today", type: "Annual Physical", status: "pending", priority: "medium" },
    { id: 3, patient: "Emma Davis", time: "02:00 PM", date: "Today", type: "Genetic Consultation", status: "confirmed", priority: "medium" },
    { id: 4, patient: "Robert Wilson", time: "04:30 PM", date: "Today", type: "Lab Result Review", status: "confirmed", priority: "low" },
  ])

  const getStatusStyle = (status) => {
      switch(status) {
          case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
          case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
          default: return 'bg-slate-50 text-slate-400 border-slate-100';
      }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-outfit">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Clinical Scheduler</h1>
                <p className="text-slate-500 font-medium">Manage your daily procedure queue and consultation nodes.</p>
            </div>
            <div className="flex items-center gap-3">
                <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-200 transition-all active:scale-95">
                    <CalendarCheck className="h-5 w-5 mr-2" />
                    Block Schedule
                </Button>
            </div>
        </div>

        {/* SCHEDULE INTERFACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT: TODAY'S TIMELINE */}
            <div className="lg:col-span-8 space-y-6">
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white overflow-hidden">
                    <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-800">Queue: Today</CardTitle>
                            <CardDescription className="text-lg font-medium">Synchronized with Sanjeevni Time-Protocol.</CardDescription>
                        </div>
                        <Badge className="bg-slate-100 text-slate-500 border-none font-black px-4 py-2 rounded-xl">OCT 24, 2026</Badge>
                    </CardHeader>
                    <CardContent className="p-10 pt-6">
                        <div className="space-y-4">
                            {appointments.map((a) => (
                                <div key={a.id} className="group relative flex flex-col sm:flex-row items-center justify-between p-6 rounded-[2.2rem] border-2 border-slate-100 hover:border-indigo-100 bg-white transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100/40 hover:-translate-y-1">
                                    <div className="flex items-center gap-6 mb-4 sm:mb-0 w-full sm:w-auto">
                                        <div className="h-16 w-16 min-w-[64px] rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-500 shadow-inner">
                                            <User className="h-8 w-8 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <p className="font-black text-slate-800 text-lg leading-tight truncate">{a.patient}</p>
                                                <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${getStatusStyle(a.status)}`}>
                                                    {a.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" /> {a.time}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Stethoscope className="h-3.5 w-3.5" /> {a.type}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all"
                                        >
                                            <Video className="h-5 w-5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-12 w-12 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-all"
                                        >
                                            <Phone className="h-5 w-5" />
                                        </Button>
                                        <Button className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-xs shadow-lg transition-all active:scale-95">
                                            START SESSION
                                        </Button>
                                    </div>
                                    
                                    {/* Priority Indicator */}
                                    <div className={`absolute top-4 right-6 w-1.5 h-1.5 rounded-full ${
                                        a.priority === 'high' ? 'bg-rose-500 animate-pulse' : 
                                        a.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                                    }`} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: ANALYTICS & ACTIONS */}
            <div className="lg:col-span-4 space-y-8">
                
                {/* UP NEXT MINI CARD */}
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-indigo-100 bg-indigo-600 text-white overflow-hidden relative">
                    <CardHeader className="p-8 pb-0 shrink-0">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] opacity-60">Initializing Next...</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                <User className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="text-xl font-black">{appointments[1]?.patient}</p>
                                <p className="text-sm font-bold opacity-70">ETA: {appointments[1]?.time}</p>
                            </div>
                        </div>
                        <Button className="w-full h-14 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-black shadow-xl transition-all">
                            PREPARE DOSSIER
                        </Button>
                    </CardContent>
                    <Calendar className="absolute -bottom-10 -right-10 h-40 w-40 text-white/5 rotate-12" />
                </Card>

                {/* SCHEDULER STATS */}
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 bg-white p-8 space-y-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Procedure Efficiency</p>
                        <div className="flex items-end gap-2">
                            <h4 className="text-4xl font-black text-slate-800">94<sub className="text-xl">%</sub></h4>
                            <div className="mb-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full w-[94%] bg-emerald-400 rounded-full" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-2xl font-black text-slate-800">12</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Total</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                            <p className="text-2xl font-black text-slate-800">08</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Confirmed</p>
                        </div>
                    </div>

                    <Button variant="ghost" className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 hover:bg-indigo-100">
                        GENERATE REPORT
                    </Button>
                </Card>
            </div>
        </div>
    </div>
  )
}

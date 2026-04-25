"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { HeartPulse } from "lucide-react"

export default function VitalsVariationGraph({ vitalsHistory }) {
    if (!vitalsHistory || vitalsHistory.length <= 1) return null;

    return (
        <Card className="card-premium p-8">
            <CardHeader className="px-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-xl">
                        <HeartPulse className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black">Vitals Variation</CardTitle>
                        <p className="text-slate-400 font-medium">Real-time heart rate & SpO2 trends from IoT wearable</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[350px] px-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vitalsHistory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                        <YAxis domain={[60, 120]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-10} />
                        <Tooltip 
                            contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem'}}
                            cursor={{fill: '#f8fafc'}}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#ef4444" strokeWidth={3} dot={{fill: '#ef4444', r: 4}} activeDot={{r: 6}} />
                        <Line type="monotone" dataKey="spO2" name="SpO2 (%)" stroke="#3b82f6" strokeWidth={3} dot={{fill: '#3b82f6', r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

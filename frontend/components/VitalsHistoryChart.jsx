"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"

export default function VitalsHistoryChart({ patientId = "patient1" }) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/api/v1/health/patient/${patientId}/history?limit=30`)
                if (res.ok) {
                    const data = await res.json()
                    // Data from dynamoDB is likely latest first, so reverse it for chronological plotting
                    const formattedData = data.reverse().map(item => {
                        const date = new Date(item.timestamp)
                        return {
                            time: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                            heartRate: item.heartRate || item.hr || item.bpm || 0,
                            spO2: item.spO2 || item.spo2 || 0,
                            temperature: item.temperature || item.temp || 0,
                        }
                    })
                    setHistory(formattedData)
                }
            } catch (err) {
                console.error("Failed to fetch vitals history", err)
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
        
        // Optional: Polling every 10 seconds to update chart, 
        // though live updates are handled by socket in HeartRateMonitor
        const interval = setInterval(fetchHistory, 10000)
        return () => clearInterval(interval)
    }, [patientId])

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800">Historical Vitals (DynamoDB)</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-500">Loading historical data...</div>
                ) : history.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-500">No historical data available.</div>
                ) : (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#f87171" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#f87171" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="spO2" name="SpO2 (%)" stroke="#60a5fa" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#fbbf24" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

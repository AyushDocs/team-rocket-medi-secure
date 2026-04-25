"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function HealthNetworkDistribution({ graphData }) {
    return (
        <Card className="card-premium p-8">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl font-black">Health Network Distribution</CardTitle>
                <p className="text-slate-400 font-medium">Volume of cross-hospital record syncing</p>
            </CardHeader>
            <CardContent className="h-[350px] px-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graphData} radius={[10, 10, 0, 0]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-10} />
                        <Tooltip 
                            contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem'}}
                            cursor={{fill: '#f8fafc'}}
                        />
                        <Bar dataKey="count" fill="#3b82f6" barSize={40}>
                            {graphData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

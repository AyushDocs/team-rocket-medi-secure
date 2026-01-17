"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export default function AppointmentsDoctor() {
  const [appointments] = useState([
    { id: 1, patient: "Sarah Johnson", time: "09:00 AM", date: "2024-01-20", type: "Follow-up", status: "confirmed" },
    { id: 2, patient: "Michael Chen", time: "10:30 AM", date: "2024-01-20", type: "Check-up", status: "pending" },
    { id: 3, patient: "Emma Davis", time: "02:00 PM", date: "2024-01-20", type: "Consultation", status: "confirmed" },
  ])

  return (
    <Card>
      <CardHeader><CardTitle>Appointments</CardTitle></CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <ul className="space-y-3">
            {appointments.map((a) => (
              <li key={a.id} className="p-3 border rounded">
                <p><strong>{a.patient}</strong> — {a.type}</p>
                <p className="text-sm text-gray-600">{a.date} at {a.time} ({a.status})</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

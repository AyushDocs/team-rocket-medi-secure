'use client';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function AcquisitionChart({ data }) {
    if (!data || data.length === 0) return <div className="h-[250px] flex items-center justify-center text-gray-400">No data available</div>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="#8884d8" name="Total Patients" />
            </LineChart>
        </ResponsiveContainer>
    );
}

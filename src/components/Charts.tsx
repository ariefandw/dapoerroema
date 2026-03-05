"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
} from "recharts";

const PIE_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#f97316"];

export function TopProductsChart({ data }: { data: { name: string; quantity: number }[] }) {
    if (!data.length) return <p className="text-muted-foreground text-sm text-center py-8">No data yet.</p>;
    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={160} />
                <Tooltip formatter={(v) => [`${v} units`, "Quantity"]} />
                <Bar dataKey="quantity" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function OutletPieChart({ data }: { data: { name: string; orders: number }[] }) {
    if (!data.length) return <p className="text-muted-foreground text-sm text-center py-8">No data yet.</p>;
    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="orders"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(props) => `${props.name ?? ""} (${((props.percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} orders`, "Orders"]} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function VolumeLineChart({ data }: { data: { day: string; orders: number }[] }) {
    if (!data.length) return <p className="text-muted-foreground text-sm text-center py-8">No data yet.</p>;
    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

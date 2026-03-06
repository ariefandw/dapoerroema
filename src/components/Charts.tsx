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

const PIE_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

export function TopProductsChart({ data }: { data: { name: string; quantity: number }[] }) {
    if (!data.length) return <p className="text-muted-foreground text-sm text-center py-8">No data yet.</p>;
    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={{ stroke: "var(--color-border)" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={{ stroke: "var(--color-border)" }} width={160} />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    formatter={(v) => [`${v} units`, "Quantity"]}
                    contentStyle={{ backgroundColor: 'var(--color-popover)', color: 'var(--color-popover-foreground)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                    itemStyle={{ color: 'var(--color-popover-foreground)' }}
                />
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
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--color-background)" strokeWidth={2} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(v) => [`${v} orders`, "Orders"]}
                    contentStyle={{ backgroundColor: 'var(--color-popover)', color: 'var(--color-popover-foreground)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                    itemStyle={{ color: 'var(--color-popover-foreground)' }}
                />
                <Legend wrapperStyle={{ color: 'var(--color-foreground)' }} />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function VolumeLineChart({ data }: { data: { day: string; orders: number }[] }) {
    if (!data.length) return <p className="text-muted-foreground text-sm text-center py-8">No data yet.</p>;
    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={{ stroke: "var(--color-border)" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} axisLine={{ stroke: "var(--color-border)" }} tickLine={{ stroke: "var(--color-border)" }} />
                <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-popover)', color: 'var(--color-popover-foreground)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                    itemStyle={{ color: 'var(--color-popover-foreground)' }}
                />
                <Line type="monotone" dataKey="orders" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4, fill: "var(--color-background)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}

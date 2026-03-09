"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getOrderWithDetails } from "@/app/actions";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Icons 
const runnerIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854866.png",
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

const outletIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/619/619153.png",
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function OrderTrackingMap({ order: initialOrder }: { order: any }) {
    const [order, setOrder] = useState(initialOrder);

    useEffect(() => {
        // Only poll if currently shipping
        if (order.status !== "shipping") return;

        const interval = setInterval(async () => {
            const fresh = await getOrderWithDetails(order.id);
            if (fresh) setOrder(fresh);
        }, 30000); // 30s poll
        return () => clearInterval(interval);
    }, [order.id, order.status]);

    // Hardcode some outlet locations if not in DB for better demo
    // In a real app, outlets would have lat/lng columns
    const outletPos: [number, number] = [-6.2088, 106.8456]; // Default to Jakarta

    const runnerPos: [number, number] | null = order.activeRunner?.last_lat && order.activeRunner?.last_lng
        ? [order.activeRunner.last_lat, order.activeRunner.last_lng]
        : order.trails.length > 0
            ? [order.trails[order.trails.length - 1].lat, order.trails[order.trails.length - 1].lng]
            : null;

    const trailPositions = order.trails.map((t: any) => [t.lat, t.lng] as [number, number]);

    // Determine center: prioritize runner, then trail, then outlet
    const center = runnerPos || (trailPositions.length > 0 ? trailPositions[trailPositions.length - 1] : outletPos);

    return (
        <div className="h-[400px] w-full relative z-10 border-t">
            <MapContainer
                center={center}
                zoom={14}
                className="h-full w-full"
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Outlet Marker */}
                <Marker position={outletPos} icon={outletIcon}>
                    <Popup>
                        <div className="p-1">
                            <p className="font-bold text-xs uppercase tracking-tight">Titik Penjemputan</p>
                            <p className="text-secondary-foreground font-medium text-sm">{order.outlet.name}</p>
                        </div>
                    </Popup>
                </Marker>

                {/* Runner Marker */}
                {runnerPos && (
                    <Marker position={runnerPos} icon={runnerIcon}>
                        <Popup>
                            <div className="p-1">
                                <p className="font-bold text-sm leading-tight">
                                    {order.activeRunner?.name || "Runner"}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                                    Lokasi Terakhir
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Tracking Trail */}
                {trailPositions.length > 1 && (
                    <Polyline
                        positions={trailPositions}
                        color="#10b981"
                        weight={4}
                        opacity={0.8}
                        dashArray="8, 12"
                    />
                )}

                <MapUpdater center={center} />
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute top-2 right-2 z-[400] bg-background/90 backdrop-blur-md p-2 rounded-lg border shadow-lg text-[10px] font-bold uppercase tracking-wider space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    <span>Rute Pengiriman</span>
                </div>
                <div className="flex items-center gap-2">
                    <img src="https://cdn-icons-png.flaticon.com/512/854/854866.png" className="w-3 h-3" />
                    <span>Posisi Runner</span>
                </div>
            </div>
        </div>
    );
}

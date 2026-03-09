"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getRunnerLocations } from "@/app/actions";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale/id";

// Fix for leaflet marker icons in Next.js
const runnerIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854866.png", // Delivery icon
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

interface Runner {
    id: string;
    name: string;
    last_lat: number | null;
    last_lng: number | null;
    last_seen_at: Date | null;
}

interface Trail {
    user_id: string;
    order_id: number | null;
    lat: number;
    lng: number;
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function RunnerMap({ initialData }: { initialData: { runners: any[]; trails: any[] } }) {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        const interval = setInterval(async () => {
            const fresh = await getRunnerLocations();
            setData(fresh);
        }, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const runnersWithLocation = data.runners.filter(r => r.last_lat && r.last_lng);
    const center: [number, number] = runnersWithLocation.length > 0
        ? [runnersWithLocation[0].last_lat!, runnersWithLocation[0].last_lng!]
        : [-6.2088, 106.8456]; // Default to Jakarta

    return (
        <div className="h-[70vh] w-full relative z-10">
            <MapContainer
                center={center}
                zoom={13}
                className="h-full w-full"
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Runner Markers */}
                {runnersWithLocation.map((r: Runner) => (
                    <Marker
                        key={r.id}
                        position={[r.last_lat!, r.last_lng!]}
                        icon={runnerIcon}
                    >
                        <Popup>
                            <div className="p-1">
                                <p className="font-bold text-sm leading-tight">{r.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Dilihat {r.last_seen_at ? formatDistanceToNow(new Date(r.last_seen_at), { addSuffix: true, locale: id }) : 'baru saja'}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Trails for each runner */}
                {runnersWithLocation.map((r: Runner) => {
                    const runnerTrails = data.trails
                        .filter(t => t.user_id === r.id)
                        .map(t => [t.lat, t.lng] as [number, number]);

                    if (runnerTrails.length < 2) return null;

                    return (
                        <Polyline
                            key={`trail-${r.id}`}
                            positions={runnerTrails}
                            color="#3b82f6"
                            weight={3}
                            opacity={0.6}
                            dashArray="5, 10"
                        />
                    );
                })}

                <MapUpdater center={center} />
            </MapContainer>
        </div>
    );
}

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getOrderWithDetails } from "@/app/actions";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Store, Truck } from "lucide-react";

// Custom Leaflet DivIcons logic
const createCustomIcon = (iconSvg: string, colorClass: string, bgColorClass: string, isBig = false) => {
    const size = isBig ? 40 : 32;
    const iconHtml = `
        <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            position: relative;
        ">
            <div class="${bgColorClass}" style="
                width: 100%;
                height: 100%;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div class="${colorClass}">
                    ${iconSvg}
                </div>
            </div>
            <div style="
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid white;
            "></div>
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [size, size + 10],
        iconAnchor: [size / 2, size + 6],
        popupAnchor: [0, -(size + 10)],
    });
};

function MapAutoCenter({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function OrderTrackingMap({ order: initialOrder }: { order: any }) {
    const [order, setOrder] = useState(initialOrder);
    const { theme } = useTheme();

    useEffect(() => {
        if (order.status !== "shipping") return;

        const interval = setInterval(async () => {
            const fresh = await getOrderWithDetails(order.id);
            if (fresh) setOrder(fresh);
        }, 30000);
        return () => clearInterval(interval);
    }, [order.id, order.status]);

    const trailPositions = (order.trails || []).map((t: any) => [t.lat, t.lng] as [number, number]);

    // Outlet position (Central Kitchen) should be the start of the trail
    const outletPos: [number, number] = trailPositions.length > 0
        ? trailPositions[0]
        : [-7.7956, 110.3695]; // Yogyakarta Default fallback

    const runnerPos: [number, number] | null = order.activeRunner?.last_lat && order.activeRunner?.last_lng
        ? [order.activeRunner.last_lat, order.activeRunner.last_lng]
        : order.trails?.length > 0
            ? [order.trails[order.trails.length - 1].lat, order.trails[order.trails.length - 1].lng]
            : null;

    const destinationPos: [number, number] | null = trailPositions.length > 0 ? trailPositions[trailPositions.length - 1] : null;

    const center = runnerPos || destinationPos || outletPos;

    // SVG Strings for icons
    const svgStore = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M18 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M14 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M10 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/><path d="M6 7v3a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V7"/></svg>`;
    const svgTruck = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10a1 1 0 0 0 1 1Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`;
    const svgPin = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

    const icons = useMemo(() => ({
        outlet: createCustomIcon(svgStore, "text-gray-700", "bg-gray-300"),
        runner: createCustomIcon(svgTruck, "text-gray-700", "bg-gray-300"),
        destination: createCustomIcon(svgPin, "text-emerald-600", "bg-emerald-100"),
    }), []);

    return (
        <div className="h-full w-full bg-muted relative overflow-hidden">
            <div className="h-full w-full">
                <MapContainer
                    center={center as any}
                    zoom={14}
                    className="h-full w-full"
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Central Kitchen Marker (Start) */}
                    <Marker position={outletPos} icon={icons.outlet}>
                        <Popup>
                            <div>
                                <p className="font-bold text-xs">Central Kitchen (Titik Awal)</p>
                                <p className="font-medium text-sm">{order.outlet.name}</p>
                            </div>
                        </Popup>
                    </Marker>

                    {/* Destination Marker (End) */}
                    {order.status === "delivered" && destinationPos && (
                        <Marker position={destinationPos} icon={icons.destination}>
                            <Popup>
                                <div>
                                    <p className="font-bold text-xs text-emerald-600">Lokasi Tujuan</p>
                                    <p className="font-medium text-sm">Pesanan Terkirim</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Runner Marker (Live) */}
                    {runnerPos && (order.status === "shipping" || order.status === "ready") && (
                        <Marker position={runnerPos} icon={icons.runner}>
                            <Popup>
                                <div className="p-1">
                                    <p className="font-bold text-sm leading-tight text-indigo-700">
                                        {order.activeRunner?.name || "Runner"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                                        Posisi Runner
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {trailPositions.length > 1 && (
                        <Polyline
                            positions={trailPositions}
                            pathOptions={{ color: "#4f46e5", weight: 5, opacity: 1, lineJoin: "round" }}
                        />
                    )}

                    <MapAutoCenter center={center as any} />
                </MapContainer>
            </div>

            {/* Legend Overlay */}
            <div className="absolute top-4 right-4 z-[1001] bg-background/90 dark:bg-zinc-900/95 backdrop-blur-md p-3 rounded-xl border border-border dark:border-zinc-800 text-xs space-y-1 shadow-xl">
                <div className="flex items-center gap-2.5">
                    <div className="w-4 h-1 rounded-full bg-indigo-500 shadow-sm" />
                    <span className="text-foreground/80">Rute Pengiriman</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground/80">
                    <Store className="size-4" />
                    <span>Titik Awal (Central Kitchen)</span>
                </div>
                {(order.status === "shipping" || order.status === "ready") && (
                    <div className="flex items-center gap-2.5 text-foreground/80">
                        <Truck className="size-4" />
                        <span>Posisi Runner</span>
                    </div>
                )}
                {order.status === "delivered" && (
                    <div className="flex items-center gap-2.5 text-foreground/80">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-800 shadow-sm ring-1 ring-emerald-200 dark:ring-emerald-900" />
                        <span>Titik Akhir (Tujuan)</span>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useGeolocation } from "@/hooks/useGeolocation";
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationGateProps {
    children: React.ReactNode;
}

export function LocationGate({ children }: LocationGateProps) {
    const { status, error, requestPermission } = useGeolocation(true);

    if (status === "granted") {
        return <>{children}</>;
    }

    if (status === "denied" || status === "unsupported") {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="max-w-sm w-full text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">Lokasi Diblokir</h2>
                        <p className="text-sm text-muted-foreground">
                            {status === "unsupported"
                                ? "Browser kamu tidak mendukung lokasi. Gunakan browser yang lebih baru."
                                : "Izin lokasi telah ditolak. Untuk menggunakan sistem sebagai Runner, aktifkan akses lokasi di pengaturan browser kamu, lalu muat ulang halaman ini."}
                        </p>
                    </div>
                    {status === "denied" && (
                        <div className="rounded-lg border border-border bg-muted/30 p-4 text-left text-xs text-muted-foreground space-y-1">
                            <p className="font-semibold text-foreground">Cara mengaktifkan:</p>
                            <p>🔒 Klik ikon gembok / titik tiga di address bar</p>
                            <p>📍 Pilih <strong>Lokasi</strong> → <strong>Izinkan</strong></p>
                            <p>🔄 Muat ulang halaman</p>
                        </div>
                    )}
                    <Button onClick={requestPermission} variant="outline" className="w-full">
                        Coba Lagi
                    </Button>
                </div>
            </div>
        );
    }

    // Pending — requesting / waiting for browser dialog
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="max-w-sm w-full text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <MapPin className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold">Izin Lokasi Diperlukan</h2>
                    <p className="text-sm text-muted-foreground">
                        Sebagai Runner, kamu perlu mengizinkan akses lokasi agar sistem dapat melacak posisi pengirimanmu secara real-time.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menunggu izin lokasi…
                </div>
                <Button onClick={requestPermission} className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Izinkan Lokasi
                </Button>
            </div>
        </div>
    );
}

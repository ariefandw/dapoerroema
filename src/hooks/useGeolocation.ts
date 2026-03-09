"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { updateRunnerLocation } from "@/app/actions";

export type GeolocationStatus = "pending" | "granted" | "denied" | "unsupported";

export interface GeolocationState {
    status: GeolocationStatus;
    position: GeolocationPosition | null;
    error: string | null;
    requestPermission: () => void;
}

export function useGeolocation(enabled: boolean = true): GeolocationState {
    const [status, setStatus] = useState<GeolocationStatus>("pending");
    const [position, setPosition] = useState<GeolocationPosition | null>(null);
    const [error, setError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);

    const startWatching = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus("unsupported");
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                setStatus("granted");
                setPosition(pos);
                setError(null);
                // Fire-and-forget: sync position to backend
                updateRunnerLocation(pos.coords.latitude, pos.coords.longitude).catch(() => { });
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setStatus("denied");
                    setError("Izin lokasi ditolak. Aktifkan lokasi di pengaturan browser.");
                } else {
                    setError(`Error lokasi: ${err.message}`);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000,
            }
        );
    }, []);

    const requestPermission = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
        setStatus("pending");
        startWatching();
    }, [startWatching]);

    useEffect(() => {
        if (!enabled) return;
        if (!navigator.geolocation) {
            setStatus("unsupported");
            return;
        }

        // Check existing permission state first to avoid unnecessary prompts
        navigator.permissions
            .query({ name: "geolocation" })
            .then((result) => {
                if (result.state === "denied") {
                    setStatus("denied");
                    setError("Izin lokasi ditolak. Aktifkan lokasi di pengaturan browser.");
                    return;
                }
                // "granted" or "prompt" — start watching (prompt will show the browser dialog)
                startWatching();
            })
            .catch(() => {
                // Permissions API not available, just try directly
                startWatching();
            });

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [enabled, startWatching]);

    return { status, position, error, requestPermission };
}

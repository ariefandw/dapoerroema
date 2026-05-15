"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * AuthProvider handles session state and visibility changes
 * - Refreshes session when tab becomes visible
 * - Handles session expiry gracefully
 * - Provides logout on session loss
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const session = useSession();
    const router = useRouter();
    const [isVisible, setIsVisible] = useState(true);
    const lastRefreshRef = useRef(Date.now());

    // Handle session refresh on visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            const nowVisible = document.visibilityState === "visible";

            if (nowVisible && !isVisible) {
                // Tab just became visible
                const timeSinceLastRefresh = Date.now() - lastRefreshRef.current;

                // Only refresh if at least 30 seconds have passed since last refresh
                if (timeSinceLastRefresh > 30000) {
                    session?.refetch?.();
                    lastRefreshRef.current = Date.now();
                }
            }

            setIsVisible(nowVisible);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isVisible, session]);

    // Periodic session refresh (every 5 minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                session?.refetch?.();
                lastRefreshRef.current = Date.now();
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [session]);

    // Handle session expiry - redirect to login if session is lost
    useEffect(() => {
        if (!session?.isPending && !session?.data) {
            // Session expired or user logged out
            console.log("Session expired, redirecting to login...");
            // Use window.location.href for a full state clear
            window.location.href = "/login";
        }
    }, [session?.data, session?.isPending]);

    return <>{children}</>;
}

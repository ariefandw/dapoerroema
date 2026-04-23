"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => {
                    console.log("[SW] Registered:", reg.scope);
                    
                    // Add listener for updates
                    reg.addEventListener("updatefound", () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                    console.log("[SW] New content found, reloading...");
                                    window.location.reload();
                                }
                            });
                        }
                    });
                })
                .catch((err) => {
                    console.error("[SW] Registration failed:", err);
                });

            // Handle controller change (e.g. from skipWaiting)
            let refreshing = false;
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }
    }, []);

    return null;
}

"use client";

import { useEffect, useRef } from "react";
import { getActiveOrders } from "@/app/actions";
import { usePathname } from "next/navigation";

export function OrderNotificationManager({ userRole, currentOutletId }: { userRole: string, currentOutletId?: number | null }) {
    const knownOrderIds = useRef<Set<number>>(new Set());
    const knownOrderStatuses = useRef<Map<number, string>>(new Map());
    const isFirstRun = useRef(true);
    const pathname = usePathname();

    useEffect(() => {
        // Request permission on mount if we haven't asked yet
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        const checkOrders = async () => {
            try {
                // If we don't have permission, no point polling for notifications (unless we want in-app toast, but sonner handles local action toasts)
                if (!("Notification" in window) || Notification.permission !== "granted") {
                    return;
                }

                const orders = await getActiveOrders(currentOutletId);

                if (isFirstRun.current) {
                    // Initialize the known orders on first load without triggering notifications
                    orders.forEach(order => {
                        knownOrderIds.current.add(order.id);
                        knownOrderStatuses.current.set(order.id, order.status);
                    });
                    isFirstRun.current = false;
                    return;
                }

                orders.forEach(order => {
                    const isNew = !knownOrderIds.current.has(order.id);
                    const oldStatus = knownOrderStatuses.current.get(order.id);
                    const statusChanged = oldStatus && oldStatus !== order.status;

                    if (isNew) {
                        knownOrderIds.current.add(order.id);
                        knownOrderStatuses.current.set(order.id, order.status);

                        // Trigger notifications based on role for NEW orders
                        if ((userRole === "admin" || userRole === "baker") && order.status === "pending") {
                            new Notification("Order Baru!", {
                                body: `Ada order baru dari ${order.outlet.name}`,
                                icon: "/icon-192.png",
                            });
                        }
                    } else if (statusChanged) {
                        knownOrderStatuses.current.set(order.id, order.status);

                        // Trigger notifications based on role for STATUS CHANGES
                        if (userRole === "runner" && order.status === "ready") {
                            new Notification("Order Siap Dikirim!", {
                                body: `Order untuk ${order.outlet.name} sudah siap dikirim.`,
                                icon: "/icon-192.png",
                            });
                        } else if (userRole === "user") {
                            if (order.status === "accepted") {
                                new Notification("Order Diterima", { body: `Order Anda sedang diproses oleh Baker.`, icon: "/icon-192.png" });
                            } else if (order.status === "shipping") {
                                new Notification("Order Dalam Perjalanan", { body: `Order Anda sedang dikirim oleh Runner.`, icon: "/icon-192.png" });
                            } else if (order.status === "delivered") {
                                new Notification("Order Selesai", { body: `Order Anda telah sampai!`, icon: "/icon-192.png" });
                            }
                        }
                    }
                });
            } catch (err) {
                console.error("Failed to check orders for notifications", err);
            }
        };

        // Poll every 30 seconds
        const interval = setInterval(checkOrders, 30000);
        return () => clearInterval(interval);
    }, [userRole, currentOutletId, pathname]);

    return null;
}

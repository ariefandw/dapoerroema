"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { UnifiedStatusStepper } from "@/components/UnifiedStatusStepper";
import { updateOrderStatus } from "@/app/actions";
import { toast } from "sonner";
import { STATUS_UI_MAP, OrderStatus } from "@/lib/status-dictionary";
import useSWR, { useSWRConfig } from "swr";
import { useGlobalState } from "@/lib/GlobalStateProvider";

const fetcher = (url: string) => fetch(url).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch');
    return data;
});

interface OrderStatusChangerProps {
    orderId: number;
    currentStatus: string;
    statusLogs: any[];
    userRole: string | undefined;
}

export function OrderStatusChanger({ orderId, currentStatus, statusLogs, userRole }: OrderStatusChangerProps) {
    const [isPending, startTransition] = useTransition();
    const { mutate } = useSWRConfig();
    const { revalidateOrders, revalidateStock } = useGlobalState();

    // Only fetch real-time updates for authenticated users
    const { data: order } = useSWR(
        userRole ? `/api/orders/${orderId}` : null,
        fetcher,
        {
            fallbackData: { status: currentStatus, statusLogs },
            refreshInterval: 5000,
            revalidateOnFocus: true,
        }
    );

    const prevStatusRef = useRef(order?.status || currentStatus);

    useEffect(() => {
        if (order && prevStatusRef.current && prevStatusRef.current !== order.status) {
            toast.info(`Status order berubah menjadi: ${STATUS_UI_MAP[order.status as OrderStatus]?.label}`);
            prevStatusRef.current = order.status;
        }
    }, [order?.status]);

    const liveStatus = (order?.status || currentStatus) as OrderStatus;
    const liveLogs = order?.statusLogs || statusLogs;

    const handleStatusChange = (orderId: number, currentStatus: string, newStatus: string, deliveryData?: { photoUrl: string; signatureUrl: string }) => {
        if (currentStatus === newStatus) return;
        startTransition(async () => {
            const result = await updateOrderStatus(orderId, currentStatus, newStatus, `/order/${orderId}`, deliveryData);
            if (result.success) {
                mutate(`/api/orders/${orderId}`);
                revalidateOrders?.();
                revalidateStock?.();
            } else {
                toast.error(result.error || "Gagal memperbarui status");
            }
        });
    };

    // For unauthenticated users, show read-only stepper (no orderId/onStatusChange)
    if (!userRole) {
        return (
            <UnifiedStatusStepper
                currentStatus={liveStatus}
                statusLogs={liveLogs}
                variant="vertical"
            />
        );
    }

    return (
        <UnifiedStatusStepper
            orderId={orderId}
            currentStatus={liveStatus}
            statusLogs={liveLogs}
            userRole={userRole}
            onStatusChange={handleStatusChange}
            disabled={isPending}
            variant="vertical"
        />
    );
}

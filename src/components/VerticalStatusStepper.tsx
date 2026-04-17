"use client";

import React, { useState } from "react";
import { OrderStatus, STATUS_UI_MAP } from "@/lib/status-dictionary";
import {
    ClipboardList,
    CheckCircle2,
    ChefHat,
    Box,
    Truck,
    Home,
    RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirm } from "./DeleteConfirm";
import { DeliveryConfirmationModal } from "./DeliveryConfirmationModal";

interface VerticalStatusStepperProps {
    orderId?: number;
    currentStatus: OrderStatus;
    statusLogs: any[];
    userRole?: string;
    onStatusChange?: (orderId: number, currentStatus: string, newStatus: string, deliveryData?: { photoUrl: string; signatureUrl: string }) => void;
    disabled?: boolean;
}

const STEPS: { status: OrderStatus; icon: any; label: string }[] = [
    { status: "pending", icon: ClipboardList, label: "Pesanan Dibuat" },
    { status: "accepted", icon: CheckCircle2, label: "Diterima Outlet" },
    { status: "in_production", icon: ChefHat, label: "Sedang Diproduksi" },
    { status: "ready", icon: Box, label: "Pesanan Siap" },
    { status: "shipping", icon: Truck, label: "Sedang Dikirim" },
    { status: "delivered", icon: Home, label: "Sampai Tujuan" },
];

export function VerticalStatusStepper({ orderId, currentStatus, statusLogs, userRole, onStatusChange, disabled }: VerticalStatusStepperProps) {
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    if (currentStatus === "cancelled") {
        return (
            <div className="flex flex-col gap-3 px-4 py-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 w-fit">
                    <span className="text-sm font-black uppercase">Dibatalkan</span>
                </div>
                {userRole === "admin" && orderId && onStatusChange && (
                    <DeleteConfirm
                        title="Pulihkan Order?"
                        description="Apakah Anda yakin ingin mengganti status order ini kembali ke 'Order' (Pending)?"
                        confirmLabel="Ya, Pulihkan"
                        onConfirm={() => onStatusChange(orderId, currentStatus, "pending")}
                    >
                        <button
                            type="button"
                            disabled={disabled}
                            className={cn(
                                "flex items-center gap-2 h-8 px-3 rounded-full border border-primary/30 bg-primary/5 text-primary transition-all duration-200 hover:bg-primary hover:text-white active:scale-95 outline-none w-fit text-sm font-bold",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Pulihkan Order
                        </button>
                    </DeleteConfirm>
                )}
            </div>
        );
    }

    const currentIndex = STEPS.findIndex(s => s.status === currentStatus);

    const isClickable = (status: OrderStatus) => {
        if (disabled || !userRole || !onStatusChange) return false;

        if (userRole === "admin") return true;

        const targetIndex = STEPS.findIndex(s => s.status === status);

        if (Math.abs(targetIndex - currentIndex) > 1) {
            return false;
        }

        if (userRole === "user") {
            return ["pending"].includes(status);
        }
        if (userRole === "baker") {
            return ["accepted", "in_production", "ready"].includes(status);
        }
        if (userRole === "runner") {
            return ["shipping", "delivered"].includes(status);
        }

        return false;
    };

    return (
        <div className="relative px-4 py-2">
            <TooltipProvider delayDuration={0}>
                <div className="space-y-0">
                    {STEPS.map((step, index) => {
                    const isCompleted = index <= currentIndex && (currentStatus as string) !== "cancelled";
                    const isCurrent = index === currentIndex && (currentStatus as string) !== "cancelled";
                    const StepIcon = step.icon;

                    // Find the log for this specific status to get the timestamp
                    const log = statusLogs.find(l => l.to_status === step.status);

                    // Special case for pending (initial creation doesn't always have a log entry with to_status 'pending' depending on how it's saved)
                    // If no log found for pending, we could use order_date if we had it, but let's assume logs are solid.

                    const getIconColor = () => {
                        if (isCompleted || isCurrent) {
                            if (step.status === 'delivered') return "text-emerald-600 dark:text-emerald-400";
                            if (step.status === 'shipping') return "text-indigo-600 dark:text-indigo-400";
                            if (step.status === 'ready') return "text-teal-600 dark:text-teal-400";
                            if (step.status === 'in_production') return "text-purple-600 dark:text-purple-400";
                            if (step.status === 'accepted') return "text-amber-600 dark:text-amber-400";
                            return "text-primary";
                        }
                        return "text-muted-foreground/40";
                    };

                    const getBgColor = () => {
                        if (isCompleted) {
                            if (step.status === 'delivered') return "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50";
                            if (step.status === 'shipping') return "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/50";
                            if (step.status === 'ready') return "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50";
                            if (step.status === 'in_production') return "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50";
                            if (step.status === 'accepted') return "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50";
                            return "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700";
                        }
                        return "bg-background border-muted/30";
                    };

                    return (
                        <div key={step.status} className="relative flex gap-4 min-h-[70px]">
                            {/* Vertical Line */}
                            {index < STEPS.length - 1 && (
                                <div className={cn(
                                    "absolute left-[15px] top-[30px] bottom-[-10px] w-[2px] transition-colors duration-500 rounded-full",
                                    index < currentIndex ? "bg-primary/40" : "bg-muted/30"
                                )} />
                            )}

                            {/* Icon Node */}
                            <div className="relative z-10 flex flex-col items-center">
                                {(() => {
                                    const canClick = isClickable(step.status);

                                    const handleStepClick = () => {
                                        if (!canClick || !orderId || !onStatusChange) return;
                                        if (step.status === "delivered" && userRole === "runner") {
                                            setConfirmModalOpen(true);
                                        } else {
                                            onStatusChange(orderId, currentStatus, step.status);
                                        }
                                    };

                                    const iconElement = (
                                        <button
                                            type="button"
                                            disabled={!canClick || disabled}
                                            onClick={handleStepClick}
                                            className={cn(
                                                "relative flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 outline-none",
                                                getBgColor(),
                                                isCurrent && "ring-4 ring-primary/10 scale-110",
                                                canClick && !isCurrent ? "hover:scale-110 cursor-pointer active:scale-95" :
                                                    !canClick && !isCurrent ? "cursor-default" : "cursor-default"
                                            )}
                                        >
                                            <StepIcon className={cn("h-4 w-4 transition-colors", getIconColor())} />
                                            {isCurrent && (
                                                <span className="absolute inset-0 rounded-full border border-primary/40 animate-[ping_2s_ease-in-out_infinite] pointer-events-none" />
                                            )}
                                        </button>
                                    );

                                    return canClick ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {iconElement}
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="font-bold uppercase ml-2">
                                                Update ke: {step.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        iconElement
                                    );
                                })()}
                            </div>

                            {/* Content */}
                            <div className={cn(
                                "flex flex-col pb-6 transition-opacity duration-300",
                                !isCompleted && "opacity-40"
                            )}>
                                <p className={cn(
                                    "text-sm font-black tracking-tight uppercase",
                                    isCurrent ? "text-primary" : "text-foreground"
                                )}>
                                    {step.label}
                                </p>
                                {log ? (
                                    <div className="mt-1 space-y-0.5">
                                        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                            {format(new Date(log.created_at), "PPP p", { locale: localeId })}
                                        </p>
                                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                            Oleh: {log.userName || "Sistem"}
                                        </p>
                                    </div>
                                ) : isCompleted && index === 0 ? (
                                    // Fallback for the first step if no log entry
                                    <p className="text-[10px] font-medium text-muted-foreground">Menunggu konfirmasi</p>
                                ) : null}
                            </div>
                        </div>
                    );
                    })}
                </div>
            </TooltipProvider>

            {orderId && onStatusChange && (
                <DeliveryConfirmationModal
                    open={confirmModalOpen}
                    onOpenChange={setConfirmModalOpen}
                    onConfirm={async (data) => {
                        onStatusChange(orderId, currentStatus, "delivered", data);
                    }}
                />
            )}
        </div>
    );
}

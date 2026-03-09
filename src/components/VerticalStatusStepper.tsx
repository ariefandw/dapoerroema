"use client";

import React from "react";
import { OrderStatus, STATUS_UI_MAP } from "@/lib/status-dictionary";
import {
    ClipboardList,
    CheckCircle2,
    ChefHat,
    Box,
    Truck,
    Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface VerticalStatusStepperProps {
    currentStatus: OrderStatus;
    statusLogs: any[];
}

const STEPS: { status: OrderStatus; icon: any; label: string }[] = [
    { status: "pending", icon: ClipboardList, label: "Pesanan Dibuat" },
    { status: "accepted", icon: CheckCircle2, label: "Diterima Outlet" },
    { status: "in_production", icon: ChefHat, label: "Sedang Diproduksi" },
    { status: "ready", icon: Box, label: "Pesanan Siap" },
    { status: "shipping", icon: Truck, label: "Sedang Dikirim" },
    { status: "delivered", icon: Home, label: "Sampai Tujuan" },
];

export function VerticalStatusStepper({ currentStatus, statusLogs }: VerticalStatusStepperProps) {
    const currentIndex = STEPS.findIndex(s => s.status === currentStatus);

    return (
        <div className="relative px-4 py-2">
            <div className="space-y-0">
                {STEPS.map((step, index) => {
                    const isCompleted = index <= currentIndex && currentStatus !== "cancelled";
                    const isCurrent = index === currentIndex && currentStatus !== "cancelled";
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
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300",
                                    getBgColor(),
                                    isCurrent && "ring-4 ring-primary/10 scale-110"
                                )}>
                                    <StepIcon className={cn("h-4 w-4 transition-colors", getIconColor())} />
                                    {isCurrent && (
                                        <span className="absolute inset-0 rounded-full border border-primary/40 animate-[ping_2s_ease-in-out_infinite] pointer-events-none" />
                                    )}
                                </div>
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
        </div>
    );
}

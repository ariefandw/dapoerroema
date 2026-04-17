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
    XCircle,
    RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirm } from "./DeleteConfirm";
import { DeliveryConfirmationModal } from "./DeliveryConfirmationModal";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export type StepperVariant = "horizontal" | "vertical";

interface UnifiedStatusStepperProps {
    orderId?: number;
    currentStatus: OrderStatus;
    statusLogs?: any[];
    userRole?: string;
    onStatusChange?: (orderId: number, currentStatus: string, newStatus: string, deliveryData?: { photoUrl: string; signatureUrl: string }) => void;
    disabled?: boolean;
    variant?: StepperVariant;
}

const STEPS: { status: OrderStatus; icon: any; label: string; labelLong: string }[] = [
    { status: "pending", icon: ClipboardList, label: "Order", labelLong: "Pesanan Dibuat" },
    { status: "accepted", icon: CheckCircle2, label: "Diterima", labelLong: "Diterima Outlet" },
    { status: "in_production", icon: ChefHat, label: "Produksi", labelLong: "Sedang Diproduksi" },
    { status: "ready", icon: Box, label: "Siap", labelLong: "Pesanan Siap" },
    { status: "shipping", icon: Truck, label: "Dikirim", labelLong: "Sedang Dikirim" },
    { status: "delivered", icon: Home, label: "Terkirim", labelLong: "Sampai Tujuan" },
];

export function UnifiedStatusStepper({
    orderId,
    currentStatus,
    statusLogs = [],
    userRole,
    onStatusChange,
    disabled,
    variant = "horizontal"
}: UnifiedStatusStepperProps) {
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // Handle cancelled status
    if (currentStatus === "cancelled") {
        if (variant === "vertical") {
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

        return (
            <div className="flex items-center gap-3 ml-auto w-fit">
                {userRole === "admin" && orderId && onStatusChange && (
                    <DeleteConfirm
                        title="Pulihkan Order?"
                        description="Apakah Anda yakin ingin mengganti status order ini kembali ke 'Order' (Pending)?"
                        confirmLabel="Ya, Pulihkan"
                        onConfirm={() => onStatusChange(orderId, currentStatus, "pending")}
                    >
                        <div className="cursor-pointer">
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            disabled={disabled}
                                            className={cn(
                                                "flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary transition-all duration-200 hover:bg-primary hover:text-white active:scale-95 outline-none",
                                                disabled && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="font-bold">
                                        Pulihkan Order
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </DeleteConfirm>
                )}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                    <span className="text-sm font-black uppercase">Dibatalkan</span>
                </div>
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
            return ["pending", "accepted", "in_production", "ready"].includes(status);
        }
        if (userRole === "runner") {
            return ["ready", "shipping", "delivered"].includes(status);
        }

        return false;
    };

    // Common color functions
    const getIconColor = (stepStatus: OrderStatus, isCompleted: boolean, isCurrent: boolean) => {
        if (isCompleted || isCurrent) {
            if (stepStatus === 'delivered') return "text-emerald-600 dark:text-emerald-400";
            if (stepStatus === 'shipping') return "text-indigo-600 dark:text-indigo-400";
            if (stepStatus === 'ready') return "text-teal-600 dark:text-teal-400";
            if (stepStatus === 'in_production') return "text-purple-600 dark:text-purple-400";
            if (stepStatus === 'accepted') return "text-amber-600 dark:text-amber-400";
            return "text-primary";
        }
        return variant === "vertical" ? "text-muted-foreground/40" : "text-muted-foreground";
    };

    const getBgColor = (stepStatus: OrderStatus, isCompleted: boolean, isCurrent: boolean) => {
        if (isCompleted) {
            if (stepStatus === 'delivered') return "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50";
            if (stepStatus === 'shipping') return "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/50";
            if (stepStatus === 'ready') return "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50";
            if (stepStatus === 'in_production') return "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50";
            if (stepStatus === 'accepted') return "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50";
            return "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700";
        }
        if (isCurrent) {
            return "bg-background border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background";
        }
        return "bg-background border-muted";
    };

    // Horizontal variant
    if (variant === "horizontal") {
        return (
            <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2 scale-95 sm:scale-100 py-2.5 pr-0 sm:pr-2">
                <TooltipProvider delayDuration={0}>
                    {STEPS.map((step, index) => {
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const canClick = isClickable(step.status);
                        const StepIcon = step.icon;

                        const handleStepClick = () => {
                            if (!canClick || !orderId || !onStatusChange) return;
                            if (step.status === "delivered" && userRole === "runner") {
                                setConfirmModalOpen(true);
                            } else {
                                onStatusChange(orderId, currentStatus, step.status);
                            }
                        };

                        return (
                            <div key={step.status} className="flex items-center">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            disabled={!canClick || disabled}
                                            onClick={handleStepClick}
                                            className={cn(
                                                "relative flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 outline-none",
                                                getBgColor(step.status, isCompleted, isCurrent),
                                                canClick && !isCurrent ? "hover:scale-110 cursor-pointer active:scale-95" :
                                                    !canClick && !isCurrent ? "opacity-40 cursor-not-allowed" : "cursor-default"
                                            )}
                                        >
                                            <StepIcon className={cn("h-4 w-4", getIconColor(step.status, isCompleted, isCurrent))} />
                                            {isCurrent && (
                                                <span className="absolute -inset-0.5 rounded-full border border-primary/40 animate-[ping_2s_ease-in-out_infinite] pointer-events-none" />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="font-bold uppercase">
                                        {step.label}
                                    </TooltipContent>
                                </Tooltip>

                                {index < STEPS.length - 1 && (
                                    <div className={cn(
                                        "h-[1.5px] w-2 sm:w-4 transition-colors duration-500",
                                        index < currentIndex ? "bg-primary/60" : "bg-muted"
                                    )} />
                                )}
                            </div>
                        );
                    })}
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

    // Vertical variant
    return (
        <div className="relative px-4 py-2">
            <TooltipProvider delayDuration={0}>
                <div className="space-y-0">
                    {STEPS.map((step, index) => {
                        const isCompleted = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        const StepIcon = step.icon;
                        const canClick = isClickable(step.status);

                        // Find the log for this specific status to get the timestamp
                        const log = statusLogs.find(l => l.to_status === step.status);

                        const handleStepClick = () => {
                            if (!canClick || !orderId || !onStatusChange) return;
                            if (step.status === "delivered" && userRole === "runner") {
                                setConfirmModalOpen(true);
                            } else {
                                onStatusChange(orderId, currentStatus, step.status);
                            }
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
                                    {canClick ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    disabled={!canClick || disabled}
                                                    onClick={handleStepClick}
                                                    className={cn(
                                                        "relative flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 outline-none",
                                                        getBgColor(step.status, isCompleted, isCurrent),
                                                        isCurrent && "ring-4 ring-primary/10 scale-110",
                                                        !isCurrent && canClick ? "hover:scale-110 cursor-pointer active:scale-95" : "cursor-default"
                                                    )}
                                                >
                                                    <StepIcon className={cn("h-4 w-4 transition-colors", getIconColor(step.status, isCompleted, isCurrent))} />
                                                    {isCurrent && (
                                                        <span className="absolute inset-0 rounded-full border border-primary/40 animate-[ping_2s_ease-in-out_infinite] pointer-events-none" />
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="font-bold uppercase ml-2">
                                                Update ke: {step.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <div
                                            className={cn(
                                                "relative flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 outline-none",
                                                getBgColor(step.status, isCompleted, isCurrent),
                                                isCurrent && "ring-4 ring-primary/10 scale-110"
                                            )}
                                        >
                                            <StepIcon className={cn("h-4 w-4 transition-colors", getIconColor(step.status, isCompleted, isCurrent))} />
                                            {isCurrent && (
                                                <span className="absolute inset-0 rounded-full border border-primary/40 animate-[ping_2s_ease-in-out_infinite] pointer-events-none" />
                                            )}
                                        </div>
                                    )}
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
                                        {step.labelLong}
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

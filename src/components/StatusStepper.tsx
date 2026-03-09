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

interface StatusStepperProps {
    orderId: number;
    currentStatus: OrderStatus;
    userRole: string;
    onStatusChange: (orderId: number, currentStatus: string, newStatus: string, deliveryData?: { photoUrl: string; signatureUrl: string }) => void;
    disabled?: boolean;
}

const STEPS: { status: OrderStatus; icon: any; label: string }[] = [
    { status: "pending", icon: ClipboardList, label: "Order" },
    { status: "accepted", icon: CheckCircle2, label: "Diterima" },
    { status: "in_production", icon: ChefHat, label: "Produksi" },
    { status: "ready", icon: Box, label: "Siap" },
    { status: "shipping", icon: Truck, label: "Dikirim" },
    { status: "delivered", icon: Home, label: "Diterima" },
];

export function StatusStepper({ orderId, currentStatus, userRole, onStatusChange, disabled }: StatusStepperProps) {
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    if (currentStatus === "cancelled") {
        return (
            <div className="flex items-center gap-3 ml-auto w-fit">
                {userRole === "admin" && (
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
        if (disabled) return false;

        // Only "Delivered" status is immutable once reached (index 5)
        if (status === "delivered" && currentIndex === 5) return false;

        // Admins can toggle anything else
        if (userRole === "admin") return true;

        // General rule: can only move forward or stay on current
        if (userRole === "baker") {
            return ["pending", "accepted", "in_production", "ready"].includes(status);
        }
        if (userRole === "runner") {
            return ["ready", "shipping", "delivered"].includes(status);
        }

        return false;
    };

    return (
        <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2 scale-95 sm:scale-100 py-2.5 pr-0 sm:pr-2">
            <TooltipProvider delayDuration={0}>
                {/* Cancellation Button for Admins */}
                {userRole === "admin" && (
                    <div className="flex items-center mr-1 sm:mr-2">
                        <DeleteConfirm
                            title="Batalkan Order?"
                            description="Tindakan ini akan membatalkan order secara keseluruhan. Anda dapat memulihkannya nanti jika diperlukan."
                            confirmLabel="Ya, Batalkan"
                            onConfirm={() => onStatusChange(orderId, currentStatus, "cancelled")}
                        >
                            <div className="cursor-pointer">
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                disabled={disabled}
                                                className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-full border border-destructive/30 bg-destructive/5 text-destructive transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground active:scale-95 outline-none",
                                                    disabled && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="font-bold uppercase">
                                            Batalkan
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </DeleteConfirm>
                        <div className="h-[1.5px] w-2 sm:w-4 bg-muted ml-1 sm:ml-2" />
                    </div>
                )}

                {STEPS.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const canClick = isClickable(step.status);
                    const StepIcon = step.icon;
                    const uiConfig = STATUS_UI_MAP[step.status];

                    // Extract colors from STATUS_UI_MAP classes if possible, or use standard mapping
                    const getIconColor = () => {
                        if (isCompleted || isCurrent) {
                            if (step.status === 'delivered') return "text-emerald-600 dark:text-emerald-400";
                            if (step.status === 'shipping') return "text-indigo-600 dark:text-indigo-400";
                            if (step.status === 'ready') return "text-teal-600 dark:text-teal-400";
                            if (step.status === 'in_production') return "text-purple-600 dark:text-purple-400";
                            if (step.status === 'accepted') return "text-amber-600 dark:text-amber-400";
                            return "text-primary";
                        }
                        return "text-muted-foreground";
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
                        if (isCurrent) {
                            return "bg-background border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background";
                        }
                        return "bg-background border-muted";
                    };

                    const handleStepClick = () => {
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
                                            getBgColor(),
                                            canClick && !isCurrent ? "hover:scale-110 cursor-pointer active:scale-95" :
                                                !canClick && !isCurrent ? "opacity-40 cursor-not-allowed" : "cursor-default"
                                        )}
                                    >
                                        <StepIcon className={cn("h-4 w-4", getIconColor())} />
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

            <DeliveryConfirmationModal
                open={confirmModalOpen}
                onOpenChange={setConfirmModalOpen}
                onConfirm={async (data) => {
                    onStatusChange(orderId, currentStatus, "delivered", data);
                }}
            />
        </div>
    );
}

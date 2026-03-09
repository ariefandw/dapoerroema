export type OrderStatus =
    | 'pending'
    | 'accepted'
    | 'in_production'
    | 'ready'
    | 'shipping'
    | 'delivered'
    | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type DiscountType = 'percentage' | 'fixed';

import {
    Clock,
    CheckCircle2,
    HandMetal,
    Package,
    Truck,
    CheckCheck,
    XCircle,
    LucideIcon
} from "lucide-react";

export const STATUS_UI_MAP: Record<OrderStatus, { label: string; bg: string; text: string; icon: LucideIcon }> = {
    pending: {
        label: 'Order',
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        text: 'text-zinc-900 dark:text-zinc-200',
        icon: Clock
    },
    accepted: {
        label: 'Diterima Baker',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-900 dark:text-amber-300',
        icon: HandMetal
    },
    in_production: {
        label: 'Produksi',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-900 dark:text-blue-300',
        icon: Package
    },
    ready: {
        label: 'Ready',
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-900 dark:text-emerald-300',
        icon: CheckCircle2
    },
    shipping: {
        label: 'Dikirim',
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-900 dark:text-indigo-300',
        icon: Truck
    },
    delivered: {
        label: 'Terkirim',
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-900 dark:text-green-300',
        icon: CheckCheck
    },
    cancelled: {
        label: 'Dibatalkan',
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-900 dark:text-red-300',
        icon: XCircle
    },
};

export const PAYMENT_STATUS_MAP: Record<PaymentStatus, { label: string; colorClass: string }> = {
    pending: {
        label: 'Belum Bayar',
        colorClass: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50',
    },
    paid: {
        label: 'Lunas',
        colorClass: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800/50',
    },
    cancelled: {
        label: 'Dibatalkan',
        colorClass: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800/50',
    },
};

export const PAYMENT_METHOD_MAP: Record<PaymentMethod, { label: string; icon: string }> = {
    cash: { label: 'Tunai', icon: '💵' },
    qris: { label: 'QRIS', icon: '📱' },
    transfer: { label: 'Transfer', icon: '🏦' },
};

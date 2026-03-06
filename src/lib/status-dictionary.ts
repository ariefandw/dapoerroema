export type OrderStatus =
    | 'pending'
    | 'accepted'
    | 'in_production'
    | 'ready'
    | 'shipping'
    | 'delivered';

export const STATUS_UI_MAP: Record<OrderStatus, { label: string; colorClass: string; bgClass: string; textClass: string }> = {
    pending: {
        label: 'Order',
        colorClass: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-400',
        bgClass: 'bg-slate-500',
        textClass: 'text-slate-800',
    },
    accepted: {
        label: 'Diterima Baker',
        colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
        bgClass: 'bg-yellow-500',
        textClass: 'text-yellow-800',
    },
    in_production: {
        label: 'Produksi',
        colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
        bgClass: 'bg-blue-500',
        textClass: 'text-blue-800',
    },
    ready: {
        label: 'Ready',
        colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400',
        bgClass: 'bg-emerald-500',
        textClass: 'text-emerald-800',
    },
    shipping: {
        label: 'Dikirim',
        colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-800',
    },
    delivered: {
        label: 'Terkirim',
        colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
        bgClass: 'bg-green-600',
        textClass: 'text-green-800',
    },
};

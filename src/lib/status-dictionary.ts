export type OrderStatus =
    | 'pending'
    | 'accepted'
    | 'in_production'
    | 'ready'
    | 'shipping'
    | 'delivered';

export type PaymentStatus = 'pending' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type DiscountType = 'percentage' | 'fixed';

export const STATUS_UI_MAP: Record<OrderStatus, { label: string; colorClass: string }> = {
    pending: {
        label: 'Order',
        colorClass: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700',
    },
    accepted: {
        label: 'Diterima Baker',
        colorClass: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50',
    },
    in_production: {
        label: 'Produksi',
        colorClass: 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50',
    },
    ready: {
        label: 'Ready',
        colorClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
    },
    shipping: {
        label: 'Dikirim',
        colorClass: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50',
    },
    delivered: {
        label: 'Terkirim',
        colorClass: 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800/50',
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
        label: 'Batal',
        colorClass: 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800/50',
    },
};

export const PAYMENT_METHOD_MAP: Record<PaymentMethod, { label: string; icon: string }> = {
    cash: { label: 'Tunai', icon: '💵' },
    qris: { label: 'QRIS', icon: '📱' },
    transfer: { label: 'Transfer', icon: '🏦' },
};

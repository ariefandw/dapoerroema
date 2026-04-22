"use client";

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { SWRConfig, mutate } from 'swr';
import { useSession } from "@/lib/auth-client";

interface GlobalStateContextType {
    // Orders
    revalidateOrders: () => void;
    revalidateOrder: (id: number) => void;
    // Stock
    revalidateStock: () => void;
    revalidateProducts: () => void;
    // Mutate helpers for optimistic updates
    updateOrderStatusOptimistic: (orderId: number, newStatus: string) => void;
    // Session
    refreshSession: () => void;
}

const GlobalStateContext = createContext<GlobalStateContextType | null>(null);

interface GlobalStateProviderProps {
    children: ReactNode;
}

export function GlobalStateProvider({ children }: GlobalStateProviderProps) {
    const session = useSession();

    // Centralized revalidation functions using SWR's mutate
    const revalidateOrders = useCallback(() => {
        mutate((key) => typeof key === 'string' && key.startsWith('/api/orders'));
    }, []);

    const revalidateOrder = useCallback((id: number) => {
        mutate(`/api/orders/${id}`);
    }, []);

    const revalidateStock = useCallback(() => {
        mutate((key) => typeof key === 'string' && key.includes('stock'));
    }, []);

    const revalidateProducts = useCallback(() => {
        mutate((key) => typeof key === 'string' && key.includes('products'));
    }, []);

    // Optimistic update for order status changes
    const updateOrderStatusOptimistic = useCallback((orderId: number, newStatus: string) => {
        // Update the specific order
        mutate(
            `/api/orders/${orderId}`,
            (current: any) => current ? ({ ...current, status: newStatus }) : current,
            false // Don't revalidate yet, wait for server response
        );
        // Update orders list
        mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/orders'),
            (orders: any[] | undefined) => orders?.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o),
            false
        );
    }, []);

    const refreshSession = useCallback(() => {
        session?.refetch?.();
    }, [session]);

    const contextValue: GlobalStateContextType = {
        revalidateOrders,
        revalidateOrder,
        revalidateStock,
        revalidateProducts,
        updateOrderStatusOptimistic,
        refreshSession,
    };

    return (
        <GlobalStateContext.Provider value={contextValue}>
            <SWRConfig value={{
                refreshInterval: 5000,
                revalidateOnFocus: true,
                dedupingInterval: 2000,
                revalidateOnMount: true,
                fetcher: async (url: string) => {
                    const res = await fetch(url);
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to fetch');
                    return data;
                },
            }}>
                {children}
            </SWRConfig>
        </GlobalStateContext.Provider>
    );
}

/**
 * Hook to access global state management functions
 * Provides centralized SWR revalidation and optimistic updates
 */
export const useGlobalState = (): GlobalStateContextType => {
    const context = useContext(GlobalStateContext);
    if (!context) {
        throw new Error('useGlobalState must be used within a GlobalStateProvider');
    }
    return context;
};

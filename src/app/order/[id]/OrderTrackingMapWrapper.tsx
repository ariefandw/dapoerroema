"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const OrderTrackingMap = dynamic<{ order: any }>(() => import("./OrderTrackingMap"), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-none" />,
});

export default function OrderTrackingMapWrapper({ order }: { order: any }) {
    return <OrderTrackingMap order={order} />;
}

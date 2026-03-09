"use client";

import dynamic from "next/dynamic";

const RunnerMap = dynamic(() => import("./RunnerMap"), {
    ssr: false,
    loading: () => <div className="h-[70vh] w-full bg-muted animate-pulse rounded-xl" />
});

export default function RunnerMapWrapper({ initialData }: { initialData: any }) {
    return <RunnerMap initialData={initialData} />;
}

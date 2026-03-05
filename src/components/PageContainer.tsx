import { cn } from "@/lib/utils";

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
    return (
        <div className={cn("max-w-7xl mx-auto p-4 md:p-6 space-y-8", className)}>
            {children}
        </div>
    );
}

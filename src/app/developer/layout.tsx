import { Toaster } from "sonner";

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Toaster richColors position="top-right" />
        </>
    );
}

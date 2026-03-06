"use client";

import { useTransition } from "react";
import { DeleteConfirm } from "./DeleteConfirm";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteActionButtonProps {
    action: () => Promise<{ success: boolean; message?: string }>;
    title?: string;
    description?: string;
}

export function DeleteActionButton({ action, title, description }: DeleteActionButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const res = await action();
            if (res.success) {
                toast.success(res.message || "Data berhasil dihapus");
            } else {
                toast.error(res.message || "Gagal menghapus data");
            }
        });
    };

    return (
        <DeleteConfirm
            onConfirm={handleDelete}
            title={title}
            description={description}
        >
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                disabled={isPending}
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </DeleteConfirm>
    );
}

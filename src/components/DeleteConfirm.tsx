"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DeleteConfirmProps {
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    children?: React.ReactNode;
}

export function DeleteConfirm({
    onConfirm,
    title = "Hapus Data?",
    description = "Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen dari server.",
    confirmLabel = "Ya, Hapus",
    children
}: DeleteConfirmProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-destructive/10 rounded-full text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                    <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        className="w-full sm:w-auto font-bold"
                        onClick={() => {
                            onConfirm();
                            setOpen(false);
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

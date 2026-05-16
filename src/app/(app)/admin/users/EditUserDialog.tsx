"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, User, Mail, Shield, Store } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateUserAdmin } from "@/app/actions";

const formSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    username: z.string().min(3, "Username minimal 3 karakter").max(30, "Username maksimal 30 karakter").regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh berisi huruf, angka, dan underscore").optional().or(z.literal("")),
    role: z.enum(["admin", "baker", "runner", "user"]),
    currentOutletId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        id: string;
        name: string;
        email: string;
        username?: string | null;
        role: string;
        currentOutletId?: number | null;
    };
    outlets: Array<{ id: number; name: string }>;
    onUserUpdated?: () => void;
}

export function EditUserDialog({
    open,
    onOpenChange,
    user,
    outlets,
    onUserUpdated,
}: EditUserDialogProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: user.name,
            username: user.username ?? "",
            role: user.role as any,
            currentOutletId: user.currentOutletId?.toString() || "none",
        },
    });

    function onSubmit(values: FormValues) {
        startTransition(async () => {
            const result = await updateUserAdmin({
                userId: user.id,
                name: values.name,
                username: values.username || null,
                role: values.role,
                currentOutletId: (values.currentOutletId && values.currentOutletId !== "none") ? parseInt(values.currentOutletId) : null,
            });

            if (result.success) {
                toast.success("User berhasil diperbarui");
                onOpenChange(false);
                onUserUpdated?.();
            } else {
                toast.error(result.error || "Gagal memperbarui user");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Edit Pengguna
                    </DialogTitle>
                    <DialogDescription>
                        Ubah data pengguna {user.name}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" /> Nama Lengkap
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Ariefan Nugraha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" /> Username
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: ariefan123" {...field} />
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">
                                        Kosongkan untuk menghapus username
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Peran
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih peran" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="baker">Baker</SelectItem>
                                            <SelectItem value="runner">Runner</SelectItem>
                                            <SelectItem value="user">User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="currentOutletId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Store className="h-3.5 w-3.5 text-muted-foreground" /> Outlet
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Semua Outlet</SelectItem>
                                            {outlets.map((outlet) => (
                                                <SelectItem key={outlet.id} value={outlet.id.toString()}>
                                                    {outlet.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            <Mail className="h-3 w-3 inline mr-1" />
                            Email: <span className="font-medium">{user.email}</span>
                        </div>

                        <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                                className="w-full sm:w-auto"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full sm:w-auto font-bold"
                            >
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

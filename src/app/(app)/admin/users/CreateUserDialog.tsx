"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus, Loader2, Key, User, Mail, Shield, Store } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
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
import { adminCreateUser } from "@/app/actions";

const formSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    role: z.enum(["admin", "baker", "runner", "user"]),
    currentOutletId: z.string().optional(),
    password: z.string().min(6, "Password minimal 6 karakter").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateUserDialog({ outlets }: { outlets: any[] }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "user",
            currentOutletId: "none",
            password: "",
        },
    });

    function onSubmit(values: FormValues) {
        startTransition(async () => {
            const result = await adminCreateUser({
                ...values,
                currentOutletId: (values.currentOutletId && values.currentOutletId !== "none") ? parseInt(values.currentOutletId) : null,
                role: values.role as any
            });

            if (result.success) {
                toast.success("User berhasil dibuat");
                setOpen(false);
                form.reset();
            } else {
                toast.error(result.error || "Gagal membuat user");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold gap-2 shadow-sm">
                    <UserPlus className="h-4 w-4" />
                    Tambah User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Tambah Pengguna Baru
                    </DialogTitle>
                    <DialogDescription>
                        Buat akun baru untuk karyawan Dapoer Roema. Password default adalah "Password123!" jika dikosongkan.
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="arief@test.app" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Key className="h-3.5 w-3.5 text-muted-foreground" /> Password (Opsional)
                                    </FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Min. 6 karakter" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isPending} className="w-full sm:w-auto font-bold">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan User
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

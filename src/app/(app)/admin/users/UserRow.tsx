"use client";

import { useState, useTransition } from "react";
import { toggleUserStatus, updateUser } from "@/app/actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Shield, Store, Mail, User, Ban, UserCheck } from "lucide-react";
import { type InferSelectModel } from "drizzle-orm";
import { outlets as outletsSchema } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface UserRowProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        currentOutletId?: number | null;
        currentOutlet?: InferSelectModel<typeof outletsSchema> | null;
        banned?: boolean | null;
    };
    outlets: InferSelectModel<typeof outletsSchema>[];
    view?: "desktop" | "mobile";
}

export function UserRow({ user, outlets, view = "desktop" }: UserRowProps) {
    const [isPending, startTransition] = useTransition();
    const [role, setRole] = useState(user.role);
    const [outletId, setOutletId] = useState(user.currentOutletId?.toString() || "none");
    const [isBanned, setIsBanned] = useState(user.banned || false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const roles = ["admin", "baker", "driver", "user"];

    function handleRoleChange(newRole: string) {
        setRole(newRole);
        startTransition(async () => {
            const res = await updateUser(user.id, { role: newRole });
            if (res.success) {
                toast.success("Peran user berhasil diperbaharui");
            } else {
                toast.error("Gagal memperbaharui peran");
                setRole(user.role);
            }
        });
    }

    function handleOutletChange(newOutletId: string) {
        setOutletId(newOutletId);
        const val = newOutletId === "none" ? null : parseInt(newOutletId);
        startTransition(async () => {
            const res = await updateUser(user.id, { currentOutletId: val });
            if (res.success) {
                toast.success("Outlet user berhasil diperbaharui");
            } else {
                toast.error("Gagal memperbaharui outlet");
                setOutletId(user.currentOutletId?.toString() || "none");
            }
        });
    }

    function handleToggleStatus() {
        startTransition(async () => {
            const res = await toggleUserStatus(user.id, isBanned);
            if (res.success) {
                setIsBanned(!isBanned);
                toast.success(isBanned ? "User telah diaktifkan" : "User telah dinonaktifkan");
                setConfirmOpen(false);
            } else {
                toast.error("Gagal mengubah status user");
            }
        });
    }

    if (view === "mobile") {
        return (
            <div className={`p-4 space-y-4 hover:bg-muted/10 transition-colors relative ${isBanned ? 'bg-muted/40 opacity-75' : ''}`}>
                {isPending && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                )}

                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border ${isBanned ? 'bg-muted border-muted-foreground/30 text-muted-foreground' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm truncate flex items-center gap-2">
                                {user.name}
                                {isBanned && <span className="text-[10px] font-black bg-destructive/10 text-destructive px-1.5 py-0.5 rounded uppercase tracking-tighter">OFF</span>}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className={isBanned ? "text-green-600" : "text-destructive"}
                        onClick={() => setConfirmOpen(true)}
                        disabled={isPending}
                    >
                        {isBanned ? <UserCheck className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            Peran
                        </label>
                        <Select value={role} onValueChange={handleRoleChange} disabled={isPending || isBanned}>
                            <SelectTrigger className="w-full h-9 text-xs bg-muted/30 border-none focus:ring-1">
                                <SelectValue placeholder="Peran" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r} value={r} className="capitalize text-xs">
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            Outlet
                        </label>
                        <Select value={outletId} onValueChange={handleOutletChange} disabled={isPending || isBanned}>
                            <SelectTrigger className="w-full h-9 text-xs bg-muted/30 border-none focus:ring-1">
                                <SelectValue placeholder="Outlet" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none" className="text-xs">Tiada</SelectItem>
                                {outlets.map((o) => (
                                    <SelectItem key={o.id} value={o.id.toString()} className="text-xs">
                                        {o.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent className="sm:max-w-[320px]">
                        <DialogHeader>
                            <DialogTitle>{isBanned ? "Aktifkan User?" : "Nonaktifkan User?"}</DialogTitle>
                            <DialogDescription>
                                {isBanned
                                    ? "User ini akan dapat masuk kembali ke sistem."
                                    : "User ini tidak akan bisa login sampai diaktifkan kembali."}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
                            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>Batal</Button>
                            <Button
                                variant={isBanned ? "default" : "destructive"}
                                onClick={handleToggleStatus}
                                disabled={isPending}
                                className="font-bold"
                            >
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Ya, Lanjut
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <TableRow className={`group transition-colors hover:bg-muted/20 ${isBanned ? 'bg-muted/30 opacity-70' : ''}`}>
            <TableCell className="py-4">
                <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border ${isBanned ? 'bg-muted border-muted-foreground/30 text-muted-foreground' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm flex items-center gap-2">
                            {user.name}
                            {isPending && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                            {isBanned && <span className="text-[9px] font-black bg-destructive/10 text-destructive px-1.5 py-0.5 rounded uppercase tracking-tighter border border-destructive/20">NONAKTIF</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <Select value={role} onValueChange={handleRoleChange} disabled={isPending || isBanned}>
                    <SelectTrigger className="w-32 h-8 text-xs font-semibold bg-transparent border-none hover:bg-muted transition-colors focus:ring-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {roles.map((r) => (
                            <SelectItem key={r} value={r} className="capitalize text-xs font-medium">
                                {r}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell>
                <Select value={outletId} onValueChange={handleOutletChange} disabled={isPending || isBanned}>
                    <SelectTrigger className="w-48 h-8 text-xs font-medium bg-transparent border-none hover:bg-muted transition-colors focus:ring-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none" className="text-xs">Tidak Ada Outlet</SelectItem>
                        {outlets.map((o) => (
                            <SelectItem key={o.id} value={o.id.toString()} className="text-xs">
                                {o.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell className="text-right">
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 transition-all scale-90 group-hover:scale-100 ${isBanned ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-destructive hover:text-destructive hover:bg-destructive/10"}`}
                            disabled={isPending}
                        >
                            {isBanned ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {isBanned ? <UserCheck className="h-5 w-5 text-green-600" /> : <Ban className="h-5 w-5 text-destructive" />}
                                {isBanned ? "Aktifkan Kembali Pengguna?" : "Nonaktifkan Pengguna?"}
                            </DialogTitle>
                            <DialogDescription className="pt-2">
                                {isBanned
                                    ? `Apakah Anda yakin ingin mengaktifkan kembali akses untuk ${user.name}? User ini akan segera bisa login kembali.`
                                    : `Apakah Anda yakin ingin menonaktifkan ${user.name}? User ini tidak akan bisa mengakses sistem Orbery sampai diaktifkan kembali.`}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0 mt-6 pt-4 border-t">
                            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isPending}>Batal</Button>
                            <Button
                                variant={isBanned ? "default" : "destructive"}
                                onClick={handleToggleStatus}
                                disabled={isPending}
                                className="font-bold px-6"
                            >
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isBanned ? "Ya, Aktifkan" : "Ya, Nonaktifkan"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </TableCell>
        </TableRow>
    );
}


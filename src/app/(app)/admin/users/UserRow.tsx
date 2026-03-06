"use client";

import { useState, useTransition } from "react";
import { updateUser } from "@/app/actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Shield, Store, Mail, User } from "lucide-react";
import { type InferSelectModel } from "drizzle-orm";
import { outlets as outletsSchema } from "@/db/schema";

interface UserRowProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        currentOutletId?: number | null;
        currentOutlet?: InferSelectModel<typeof outletsSchema> | null;
    };
    outlets: InferSelectModel<typeof outletsSchema>[];
    view?: "desktop" | "mobile";
}

export function UserRow({ user, outlets, view = "desktop" }: UserRowProps) {
    const [isPending, startTransition] = useTransition();
    const [role, setRole] = useState(user.role);
    const [outletId, setOutletId] = useState(user.currentOutletId?.toString() || "none");

    const roles = ["admin", "baker", "driver", "owner"];

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

    if (view === "mobile") {
        return (
            <div className="p-4 space-y-4 hover:bg-muted/10 transition-colors relative">
                {isPending && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate">{user.name}</span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{user.email}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            Peran
                        </label>
                        <Select value={role} onValueChange={handleRoleChange} disabled={isPending}>
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
                        <Select value={outletId} onValueChange={handleOutletChange} disabled={isPending}>
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
            </div>
        );
    }

    return (
        <TableRow className="group transition-colors hover:bg-muted/20">
            <TableCell className="py-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/20">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm flex items-center gap-2">
                            {user.name}
                            {isPending && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <Select value={role} onValueChange={handleRoleChange} disabled={isPending}>
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
                <Select value={outletId} onValueChange={handleOutletChange} disabled={isPending}>
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
        </TableRow>
    );
}


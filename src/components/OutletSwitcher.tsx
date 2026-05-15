"use client";

import { useRouter } from "next/navigation";
import { updateCurrentOutlet } from "@/app/actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChefHat, ChevronsUpDown, Check } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

interface OutletSwitcherProps {
    outlets: any[];
    currentOutletId?: number | null;
    userRole?: string;
}

export function OutletSwitcher({ outlets, currentOutletId, userRole }: OutletSwitcherProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [localOutletId, setLocalOutletId] = useState<number | null | undefined>(currentOutletId);

    // Sync local state when server prop updates
    useEffect(() => {
        setLocalOutletId(currentOutletId);
    }, [currentOutletId]);

    function handleOutletSwitch(outletId: string) {
        if (isPending) return;
        const val = outletId === "all" ? null : parseInt(outletId);
        startTransition(async () => {
            const res = await updateCurrentOutlet(val);
            if (res.success) {
                setLocalOutletId(val);
                await mutate(() => true);
                router.refresh();
                toast.success("Outlet berhasil dipindah");
            } else {
                toast.error(res.error || "Gagal pindah outlet");
            }
        });
    }

    const effectiveOutletId = localOutletId ?? currentOutletId;
    const currentOutlet = outlets.find(o => o.id === effectiveOutletId);
    
    // For Bakers and Runners, we ALWAYS show "Dapoer Roema" and hide the switcher
    // regardless of what their currentOutletId is in the database.
    const normalizedRole = userRole?.toLowerCase();
    const isProductionRole = normalizedRole === "baker" || normalizedRole === "runner";

    if (isProductionRole) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <ChefHat className="h-5 w-5" />
                <span className="text-sm font-black uppercase tracking-tight">Dapoer Roema</span>
            </div>
        );
    }

    const displayName = currentOutlet?.name || "Dapoer Roema";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 hover:bg-muted transition-colors rounded-lg group"
                >
                    <ChefHat className="size-6" />
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-xs font-black text-muted-foreground/60 hidden">Dapoer Roema</span>
                        <span className="text-sm font-bold truncate max-w-[120px]">
                            {displayName}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground ml-1 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel className="text-sm font-black uppercase text-muted-foreground/70 px-2 py-1.5">
                    Pilih Outlet
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={effectiveOutletId?.toString() || "all"}
                    onValueChange={handleOutletSwitch}
                >
                    {userRole === "admin" && (
                        <DropdownMenuRadioItem value="all" className="text-sm py-2 cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-tight">Dapoer Roema</span>
                                {!effectiveOutletId && <Check className="h-3.5 w-3.5 ml-2 text-primary stroke-[3px]" />}
                            </div>
                        </DropdownMenuRadioItem>
                    )}
                    {outlets.map((o) => (
                        <DropdownMenuRadioItem
                            key={o.id}
                            value={o.id.toString()}
                            className="text-sm py-2 cursor-pointer font-medium"
                        >
                            <div className="flex items-center justify-between w-full">
                                {o.name}
                                {effectiveOutletId === o.id && <Check className="h-3 w-3 ml-2 text-primary" />}
                            </div>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

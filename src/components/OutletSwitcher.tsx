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
import { useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OutletSwitcherProps {
    outlets: any[];
    currentOutletId?: number | null;
}

export function OutletSwitcher({ outlets, currentOutletId }: OutletSwitcherProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    function handleOutletSwitch(outletId: string) {
        const val = outletId === "all" ? null : parseInt(outletId);
        startTransition(async () => {
            const res = await updateCurrentOutlet(val);
            if (res.success) {
                toast.success("Outlet berhasil dipindah");
                router.refresh();
            } else {
                toast.error("Gagal pindah outlet");
            }
        });
    }

    const currentOutlet = outlets.find(o => o.id === currentOutletId);

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
                            {currentOutlet?.name || "Semua Outlet"}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground ml-1 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 px-2 py-1.5">
                    Pilih Outlet
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                    value={currentOutletId?.toString() || "all"}
                    onValueChange={handleOutletSwitch}
                >
                    <DropdownMenuRadioItem value="all" className="text-xs py-2 cursor-pointer font-medium">
                        <div className="flex items-center justify-between w-full">
                            Semua Outlet
                            {!currentOutletId && <Check className="h-3 w-3 ml-2 text-primary" />}
                        </div>
                    </DropdownMenuRadioItem>
                    {outlets.map((o) => (
                        <DropdownMenuRadioItem
                            key={o.id}
                            value={o.id.toString()}
                            className="text-xs py-2 cursor-pointer font-medium"
                        >
                            <div className="flex items-center justify-between w-full">
                                {o.name}
                                {currentOutletId === o.id && <Check className="h-3 w-3 ml-2 text-primary" />}
                            </div>
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

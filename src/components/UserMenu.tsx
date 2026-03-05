"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface UserMenuProps {
    user: {
        name: string;
        email: string;
        role: string;
    };
}

export function UserMenu({ user }: UserMenuProps) {
    const router = useRouter();

    async function handleSignOut() {
        await signOut();
        router.push("/login");
        router.refresh();
    }

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-muted border p-0 hover:bg-muted/80">
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold">
                        {initials || <User className="h-4 w-4" />}
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold leading-none">{user.name}</p>
                        <p className="text-[10px] leading-none text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                            {user.role}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground pt-1">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

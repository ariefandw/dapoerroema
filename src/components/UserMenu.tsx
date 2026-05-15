"use client";

import { useState } from "react";
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
import { LogOut, UserPen, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { EditProfileDialog } from "@/components/EditProfileDialog";

interface UserMenuProps {
    user: {
        id: string;
        name: string;
        email: string;
        username?: string | null;
        role: string;
        image?: string | null;
    };
}

export function UserMenu({ user }: UserMenuProps) {
    const router = useRouter();
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleSignOut() {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        try {
            // Sign out and ensure session is destroyed
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        // Force a hard redirect to ensure all state is cleared
                        window.location.href = "/login";
                    },
                    onError: (ctx) => {
                        console.error("Logout failed:", ctx.error);
                        // Fallback: redirect anyway to try and clear UI state
                        window.location.href = "/login";
                    }
                },
            });
        } catch (error) {
            console.error("Logout exception:", error);
            // Emergency fallback
            window.location.href = "/login";
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-muted/50 border border-border/50 hover:bg-muted transition-all flex items-center justify-center p-0" disabled={isLoggingOut}>
                        {isLoggingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <UserAvatar name={user.name} image={user.image} size="md" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-bold leading-none">{user.name}</p>
                            {user.username && (
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                            )}
                            <p className="text-sm font-black leading-none text-muted-foreground uppercase mt-0.5">
                                {user.role}
                            </p>
                            <p className="text-sm leading-none text-muted-foreground pt-1 truncate">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setEditDialogOpen(true)}
                        className="cursor-pointer"
                        disabled={isLoggingOut}
                    >
                        <UserPen className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={handleSignOut} 
                        className="text-destructive focus:text-destructive cursor-pointer"
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <LogOut className="mr-2 h-4 w-4" />
                        )}
                        <span>{isLoggingOut ? "Keluar..." : "Keluar"}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditProfileDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                user={user}
                onProfileUpdated={() => router.refresh()}
            />
        </>
    );
}

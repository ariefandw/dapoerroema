import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface UserAvatarProps {
    name?: string | null;
    image?: string | null;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function UserAvatar({ name, image, size = "md", className }: UserAvatarProps) {
    const getInitials = (name: string | null | undefined) => {
        if (!name) return null;
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const initials = getInitials(name);

    const sizeClasses = {
        sm: "h-6 w-6 text-[8px]",
        md: "h-9 w-9 text-[10px]",
        lg: "h-12 w-12 text-xs",
    };

    const innerSizeClasses = {
        sm: "h-4 w-4",
        md: "h-7 w-7",
        lg: "h-10 w-10",
    };

    return (
        <div
            className={cn(
                "relative rounded-full bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden",
                sizeClasses[size],
                className
            )}
        >
            {image ? (
                <img
                    src={image}
                    alt={name || "User"}
                    className="h-full w-full object-cover"
                />
            ) : initials ? (
                <div
                    className={cn(
                        "flex rounded-full bg-primary/20 text-primary items-center justify-center font-bold border border-primary/20",
                        innerSizeClasses[size]
                    )}
                >
                    {initials}
                </div>
            ) : (
                <User className={cn("text-muted-foreground", innerSizeClasses[size])} />
            )}
        </div>
    );
}

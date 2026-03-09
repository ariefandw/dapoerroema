import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronsRight, Check } from "lucide-react";

export interface SlideToConfirmHandle {
    reset: () => void;
}

interface SlideToConfirmProps {
    onConfirm: () => void;
    label?: string;
    successLabel?: string;
    loading?: boolean;
}

export const SlideToConfirm = forwardRef<SlideToConfirmHandle, SlideToConfirmProps>(({
    onConfirm,
    label = "Geser untuk Konfirmasi",
    successLabel = "Dikonfirmasi",
    loading = false
}, ref) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [position, setPosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        reset: () => {
            setPosition(0);
            setIsConfirmed(false);
            setIsDragging(false);
        }
    }));

    const maxDelta = containerRef.current && handleRef.current
        ? containerRef.current.offsetWidth - handleRef.current.offsetWidth - 8
        : 0;

    useEffect(() => {
        if (!loading && isConfirmed && position < (maxDelta || 0)) {
            // If it failed or loading stopped without success, reset
            // But here we rely on parent to close modal
        }
    }, [loading, isConfirmed, position, maxDelta]);

    const handleStart = () => {
        if (isConfirmed || loading) return;
        setIsDragging(true);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging || isConfirmed || loading || !containerRef.current || !handleRef.current) return;

        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const rect = containerRef.current.getBoundingClientRect();
        const handleWidth = handleRef.current.offsetWidth;

        let delta = clientX - rect.left - handleWidth / 2 - 4; // 4 is padding
        const max = rect.width - handleWidth - 8;

        delta = Math.max(0, Math.min(delta, max));
        setPosition(delta);

        if (delta >= max * 0.95) {
            confirm();
        }
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const max = containerRef.current && handleRef.current
            ? containerRef.current.offsetWidth - handleRef.current.offsetWidth - 8
            : 0;

        if (position < max * 0.95) {
            setPosition(0);
        }
    };

    const confirm = () => {
        const max = containerRef.current && handleRef.current
            ? containerRef.current.offsetWidth - handleRef.current.offsetWidth - 8
            : 0;

        setPosition(max);
        setIsConfirmed(true);
        setIsDragging(false);
        onConfirm();
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMove);
            window.addEventListener("mouseup", handleEnd);
            window.addEventListener("touchmove", handleMove);
            window.addEventListener("touchend", handleEnd);
        } else {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleEnd);
        }
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleMove);
            window.removeEventListener("touchend", handleEnd);
        };
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative h-14 w-full rounded-full p-1 transition-all duration-300 overflow-hidden select-none touch-none",
                isConfirmed ? "bg-emerald-500" : "bg-muted border-2 border-dashed border-border"
            )}
        >
            {/* Text Label */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center text-sm font-bold transition-all duration-300",
                isConfirmed ? "text-white" : "text-muted-foreground ml-8"
            )}>
                {isConfirmed ? (
                    <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 animate-[bounce_0.5s_ease-in-out]" />
                        {successLabel}
                    </div>
                ) : (
                    <span className="opacity-70">{label}</span>
                )}
            </div>

            {/* Background progress */}
            <div
                className="absolute left-1 top-1 bottom-1 bg-emerald-500/20 rounded-full transition-all duration-100"
                style={{ width: `calc(${position}px + 32px)` }}
            />

            {/* Slider Handle */}
            <div
                ref={handleRef}
                onMouseDown={handleStart}
                onTouchStart={handleStart}
                style={{ transform: `translateX(${position}px)` }}
                className={cn(
                    "relative z-10 h-10 w-10 rounded-full flex items-center justify-center transition-shadow cursor-grab active:cursor-grabbing",
                    isConfirmed ? "bg-white text-emerald-600 shadow-lg" : "bg-emerald-600 text-white shadow-md",
                    loading && "opacity-50 cursor-wait"
                )}
            >
                {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isConfirmed ? (
                    <Check className="h-5 w-5" />
                ) : (
                    <ChevronsRight className="h-5 w-5 animate-[pulse_1.5s_infinite]" />
                )}
            </div>
        </div>
    );
});

SlideToConfirm.displayName = "SlideToConfirm";

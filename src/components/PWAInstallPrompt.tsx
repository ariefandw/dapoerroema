"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // Check if user already dismissed it this session/locally
            const hasDismissed = localStorage.getItem("pwa_prompt_dismissed");
            if (!hasDismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        setShowPrompt(false);
        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa_prompt_dismissed", "true");
    };

    if (!showPrompt) return null;

    return (
        <div className="md:hidden fixed bottom-16 sm:bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="bg-card border border-border shadow-lg rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm">Install Dapoer Roema</span>
                        <span className="text-xs text-muted-foreground">Akses lebih cepat & mudah</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 text-xs font-bold" onClick={handleInstallClick}>
                        Install
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleDismiss}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

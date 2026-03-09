"use client";

import React, { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PackageCheck, Camera, PenTool, ArrowLeft, ArrowRight } from "lucide-react";
import { ProductImageUpload } from "./ProductImageUpload";
import { SignaturePad } from "./SignaturePad";
import { SlideToConfirm, SlideToConfirmHandle } from "./SlideToConfirm";
import { toast } from "sonner";

interface DeliveryConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (data: { photoUrl: string; signatureUrl: string }) => Promise<void>;
}

export function DeliveryConfirmationModal({
    open,
    onOpenChange,
    onConfirm,
}: DeliveryConfirmationModalProps) {
    const [step, setStep] = useState(0); // 0: Photo, 1: Signature
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const sliderRef = useRef<SlideToConfirmHandle>(null);

    const handleConfirm = async () => {
        if (!photoUrl) {
            toast.error("Mohon lampirkan foto bukti pengiriman");
            setStep(0);
            sliderRef.current?.reset();
            return;
        }
        if (!signatureUrl) {
            toast.error("Mohon sertakan tanda tangan penerima");
            sliderRef.current?.reset();
            return;
        }

        setLoading(true);
        try {
            await onConfirm({ photoUrl, signatureUrl });
            onOpenChange(false);
            // Reset for next time
            setTimeout(() => {
                setStep(0);
                setPhotoUrl(null);
                setSignatureUrl(null);
            }, 300);
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan konfirmasi pengiriman");
            sliderRef.current?.reset();
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (!photoUrl) {
            toast.error("Mohon lampirkan foto bukti pengiriman dulu");
            return;
        }
        setStep(1);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!loading) onOpenChange(val);
        }}>
            <DialogContent
                className="z-[200] sm:max-w-[425px] w-full h-[100dvh] sm:h-auto max-h-none sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none sm:border-solid rounded-none sm:rounded-lg"
            >
                {/* Header */}
                <DialogHeader className="p-4 border-b bg-background sticky top-0 z-20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {step === 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 -ml-2"
                                    onClick={() => setStep(0)}
                                    disabled={loading}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            )}
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600">
                                <PackageCheck className="h-4 w-4" />
                            </div>
                            <DialogTitle className="text-base">Konfirmasi Pengiriman</DialogTitle>
                        </div>
                        <div className="text-sm font-bold uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Step {step + 1} / 2
                        </div>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6">
                    {step === 0 ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <Camera className="h-4 w-4 text-primary" />
                                    Ambil Foto Bukti
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Silakan ambil foto bukti order telah diterima oleh pelanggan.
                                </p>
                            </div>

                            <div className="min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20 overflow-hidden">
                                <ProductImageUpload
                                    currentImage={photoUrl}
                                    onImageChange={setPhotoUrl}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <PenTool className="h-4 w-4 text-primary" />
                                    Tanda Tangan Penerima
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Mintalah penerima untuk menandatangani di area bawah ini.
                                </p>
                            </div>

                            <div className="flex-1 min-h-[300px] sm:min-h-0 relative border-2 border-primary/10 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 shadow-inner">
                                <SignaturePad onSave={setSignatureUrl} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer - Fixed at bottom for mobile */}
                <DialogFooter className="p-4 border-t bg-background/80 backdrop-blur-sm sticky bottom-0 z-20 mt-auto">
                    <div className="w-full">
                        {step === 0 ? (
                            <Button
                                className="w-full h-12 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                                onClick={handleNext}
                            >
                                Lanjut ke Tanda Tangan
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <SlideToConfirm
                                    ref={sliderRef}
                                    onConfirm={handleConfirm}
                                    loading={loading}
                                    label="Geser untuk Konfirmasi"
                                    successLabel="Penerimaan Berhasil"
                                />
                            </div>
                        )}
                        {!loading && (
                            <button
                                className="w-full mt-4 text-sm font-bold uppercase text-muted-foreground/50 hover:text-destructive transition-colors"
                                onClick={() => onOpenChange(false)}
                            >
                                BATALKAN PROSES
                            </button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

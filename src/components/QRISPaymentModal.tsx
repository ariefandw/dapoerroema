"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Clock, CheckCircle2 } from "lucide-react";

interface QRISPaymentModalProps {
    open: boolean;
    onClose: () => void;
    amount: number;
    onConfirmPayment: () => void;
}

export function QRISPaymentModal({ open, onClose, amount, onConfirmPayment }: QRISPaymentModalProps) {
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);

    useEffect(() => {
        if (!open || paymentConfirmed) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [open, paymentConfirmed, onClose]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleConfirmPayment = () => {
        setPaymentConfirmed(true);
        setTimeout(() => {
            onConfirmPayment();
            handleClose();
        }, 1500);
    };

    const handleClose = () => {
        setTimeLeft(300);
        setPaymentConfirmed(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[400px]" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Pembayaran QRIS
                    </DialogTitle>
                    <DialogDescription>
                        Scan QR code di bawah untuk membayar
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* QR Code Display */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="w-64 h-64 bg-white rounded-xl border-4 border-zinc-800 flex items-center justify-center p-4">
                                {/* Static QR Code SVG placeholder */}
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    {/* QR Code border */}
                                    <rect x="5" y="5" width="90" height="90" fill="none" stroke="#000" strokeWidth="2" />

                                    {/* Corner patterns */}
                                    <rect x="10" y="10" width="20" height="20" fill="#000" />
                                    <rect x="14" y="14" width="12" height="12" fill="#fff" />
                                    <rect x="17" y="17" width="6" height="6" fill="#000" />

                                    <rect x="70" y="10" width="20" height="20" fill="#000" />
                                    <rect x="74" y="14" width="12" height="12" fill="#fff" />
                                    <rect x="77" y="17" width="6" height="6" fill="#000" />

                                    <rect x="10" y="70" width="20" height="20" fill="#000" />
                                    <rect x="14" y="74" width="12" height="12" fill="#fff" />
                                    <rect x="17" y="77" width="6" height="6" fill="#000" />

                                    {/* Random pattern for QR effect */}
                                    <rect x="35" y="10" width="5" height="5" fill="#000" />
                                    <rect x="45" y="10" width="5" height="5" fill="#000" />
                                    <rect x="55" y="10" width="5" height="5" fill="#000" />
                                    <rect x="35" y="20" width="5" height="5" fill="#000" />
                                    <rect x="50" y="20" width="5" height="5" fill="#000" />
                                    <rect x="60" y="20" width="5" height="5" fill="#000" />

                                    <rect x="10" y="35" width="5" height="5" fill="#000" />
                                    <rect x="20" y="40" width="5" height="5" fill="#000" />
                                    <rect x="10" y="50" width="5" height="5" fill="#000" />
                                    <rect x="25" y="55" width="5" height="5" fill="#000" />

                                    <rect x="35" y="35" width="30" height="30" fill="#000" />
                                    <rect x="40" y="40" width="20" height="20" fill="#fff" />
                                    <rect x="45" y="45" width="10" height="10" fill="#000" />

                                    <rect x="70" y="35" width="5" height="5" fill="#000" />
                                    <rect x="80" y="45" width="5" height="5" fill="#000" />
                                    <rect x="75" y="55" width="5" height="5" fill="#000" />
                                    <rect x="85" y="50" width="5" height="5" fill="#000" />

                                    <rect x="35" y="70" width="5" height="5" fill="#000" />
                                    <rect x="45" y="75" width="5" height="5" fill="#000" />
                                    <rect x="55" y="80" width="5" height="5" fill="#000" />
                                    <rect x="65" y="70" width="5" height="5" fill="#000" />
                                    <rect x="75" y="75" width="5" height="5" fill="#000" />
                                    <rect x="85" y="80" width="5" height="5" fill="#000" />

                                    {/* QRIS Label */}
                                    <text x="50" y="96" textAnchor="middle" fontSize="4" fill="#000" fontWeight="bold">QRIS</text>
                                </svg>
                            </div>

                            {/* Timer Badge */}
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(timeLeft)}
                            </div>
                        </div>
                    </div>

                    {/* Amount Display */}
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                        <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                            Rp {amount.toLocaleString("id-ID")}
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Buka aplikasi e-wallet atau mobile banking Anda</li>
                            <li>Pilih menu "Scan QR" atau "QRIS"</li>
                            <li>Scan kode QR di atas</li>
                            <li>Konfirmasi pembayaran</li>
                        </ol>
                    </div>

                    {/* Success State */}
                    {paymentConfirmed && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                            <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <p className="text-lg font-semibold">Pembayaran Berhasil!</p>
                                <p className="text-sm text-muted-foreground">Pesanan sedang diproses</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={handleClose} disabled={paymentConfirmed}>
                            Batal
                        </Button>
                        <Button className="flex-1" onClick={handleConfirmPayment} disabled={paymentConfirmed}>
                            {paymentConfirmed ? "Memproses..." : "Konfirmasi Pembayaran"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

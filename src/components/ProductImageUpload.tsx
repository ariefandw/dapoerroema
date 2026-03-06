"use client";

import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

interface ProductImageUploadProps {
    currentImage?: string | null;
    onImageChange: (imageUrl: string | null) => void;
}

export function ProductImageUpload({ currentImage, onImageChange }: ProductImageUploadProps) {
    const { preview, uploading, fileInputRef, handleFileSelect, handleRemove } = useImageUpload(
        currentImage,
        onImageChange
    );

    return (
        <div className="space-y-2">
            {preview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border bg-muted">
                    <img
                        src={preview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={handleRemove}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <X className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            ) : (
                <div className="w-full h-48 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/50">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No image selected</p>
                </div>
            )}
            <div className="flex gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                />
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            {preview ? "Change Image" : "Upload Image"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

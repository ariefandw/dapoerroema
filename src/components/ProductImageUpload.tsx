"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon } from "lucide-react";

interface ProductImageUploadProps {
    currentImage?: string | null;
    onImageChange: (imageUrl: string | null) => void;
}

export function ProductImageUpload({ currentImage, onImageChange }: ProductImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Image size must be less than 5MB");
            return;
        }

        // Show local preview
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setUploading(true);

        try {
            // Upload to ImageBB
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch(
                `https://api.imgbb.com/1/upload?key=f66dae6de74b7a9a0d9dfed5990b7844`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (data.success) {
                onImageChange(data.data.url);
                setPreview(data.data.url);
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            console.error("Failed to upload image:", error);
            alert("Failed to upload image. Please try again.");
            // Revert to previous state
            setPreview(currentImage || null);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onImageChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

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
                        <X className="h-4 w-4" />
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
                        "Uploading..."
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

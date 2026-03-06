"use client";

import { useState, useRef } from "react";

interface UseImageUploadOptions {
    maxSize?: number; // in bytes, default 5MB
    onSuccess?: (url: string) => void;
    onError?: (error: string) => void;
}

interface UseImageUploadResult {
    preview: string | null;
    uploading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleRemove: () => void;
    setPreview: (preview: string | null) => void;
}

export function useImageUpload(
    currentImage: string | null | undefined,
    onImageChange: (imageUrl: string | null) => void,
    options: UseImageUploadOptions = {}
): UseImageUploadResult {
    const { maxSize = 5 * 1024 * 1024, onSuccess, onError } = options;
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            const error = "Please select an image file";
            onError?.(error);
            alert(error);
            return;
        }

        // Validate file size
        if (file.size > maxSize) {
            const error = `Image size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`;
            onError?.(error);
            alert(error);
            return;
        }

        // Show local preview
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setUploading(true);

        try {
            // Upload to ImageBB
            const apiKey = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY;
            if (!apiKey) {
                throw new Error("ImageBB API key not configured");
            }

            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch(
                `https://api.imgbb.com/1/upload?key=${apiKey}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (data.success) {
                const url = data.data.url;
                onImageChange(url);
                setPreview(url);
                onSuccess?.(url);
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            console.error("Failed to upload image:", error);
            const errorMsg = "Failed to upload image. Please try again.";
            onError?.(errorMsg);
            alert(errorMsg);
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

    return {
        preview,
        uploading,
        fileInputRef,
        handleFileSelect,
        handleRemove,
        setPreview,
    };
}

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
    processing: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleRemove: () => void;
    setPreview: (preview: string | null) => void;
}

/**
 * Resize and compress an image before uploading
 * @param file - The image file to resize
 * @param maxWidth - Maximum width in pixels (default: 1024)
 * @param quality - JPEG quality (0-1, default: 0.85)
 * @returns Promise<Blob> - The resized image as a Blob
 */
async function resizeImage(
    file: File,
    maxWidth: number = 1024,
    quality: number = 0.85
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            const scale = maxWidth / img.width;
            const width = maxWidth;
            const height = img.height * scale;

            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Use better quality settings
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob with compression
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas conversion failed'));
                    }
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Convert a Blob to a File with proper metadata
 */
function blobToFile(blob: Blob, filename: string): File {
    return new File([blob], filename, {
        type: 'image/jpeg',
        lastModified: Date.now(),
    });
}

export function useImageUpload(
    currentImage: string | null | undefined,
    onImageChange: (imageUrl: string | null) => void,
    options: UseImageUploadOptions = {}
): UseImageUploadResult {
    const { maxSize = 5 * 1024 * 1024, onSuccess, onError } = options;
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
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

        // Show local preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setProcessing(true);
        setUploading(true);

        try {
            // Resize and compress the image before uploading
            const resizedBlob = await resizeImage(file, 1024, 0.85);

            // Convert blob back to File for FormData
            const resizedFile = blobToFile(resizedBlob, file.name.replace(/\.[^/.]+$/, '') + '_resized.jpg');

            console.log(`Image resized: ${file.size} bytes -> ${resizedFile.size} bytes (${Math.round((1 - resizedFile.size / file.size) * 100)}% reduction)`);

            const formData = new FormData();
            formData.append("image", resizedFile);

            setProcessing(false); // Processing done, now uploading

            // Try local upload first
            let uploadSuccess = false;
            let url = "";

            try {
                const localResponse = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const localData = await localResponse.json();
                if (localData.success) {
                    url = localData.data.url;
                    uploadSuccess = true;
                }
            } catch (e) {
                console.warn("Local upload failed, falling back to ImageBB if possible", e);
            }

            // Fallback to ImageBB if local failed and API key exists
            if (!uploadSuccess) {
                const apiKey = process.env.NEXT_PUBLIC_IMAGEBB_API_KEY;
                if (!apiKey) {
                    throw new Error("Upload failed and ImageBB API key not configured");
                }

                const response = await fetch(
                    `https://api.imgbb.com/1/upload?key=${apiKey}`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                const data = await response.json();
                if (data.success) {
                    url = data.data.url;
                    uploadSuccess = true;
                } else {
                    throw new Error("All upload methods failed");
                }
            }

            if (uploadSuccess) {
                onImageChange(url);
                setPreview(url);
                onSuccess?.(url);
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
            setProcessing(false);
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
        processing,
        fileInputRef,
        handleFileSelect,
        handleRemove,
        setPreview,
    };
}

"use client";

import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

interface AvatarUploadProps {
    currentImage?: string | null;
    onImageChange: (imageUrl: string | null) => void;
    userName?: string | null;
}

export function AvatarUpload({ currentImage, onImageChange, userName }: AvatarUploadProps) {
    const { preview, uploading, fileInputRef, handleFileSelect, handleRemove } = useImageUpload(
        currentImage,
        onImageChange,
        {
            maxSize: 2 * 1024 * 1024, // 2MB for avatars
        }
    );

    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative shrink-0">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted">
                    {preview ? (
                        <img
                            src={preview}
                            alt={userName || "Profile"}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center bg-muted">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                            <p className="text-sm text-muted-foreground text-center px-2">No photo</p>
                        </div>
                    )}
                </div>
                {preview && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md z-10"
                        onClick={handleRemove}
                        disabled={uploading}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
                {uploading && (
                    <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
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
                    variant={preview ? "outline" : "default"}
                    size="sm"
                    className="w-full sm:w-auto"
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
                            {preview ? "Change Photo" : "Upload Photo"}
                        </>
                    )}
                </Button>
                <p className="text-sm text-muted-foreground">
                    JPG, PNG or GIF. Max 2MB.
                </p>
            </div>
        </div>
    );
}

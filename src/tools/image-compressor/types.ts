export interface ImageItem {
    id: string;
    file: File;
    previewUrl: string;
    originalSize: number;
    originalWidth?: number;
    originalHeight?: number;
    settings: ImageSettings;
    compressedBlob?: Blob;
    compressedUrl?: string;
    compressedSize?: number;
    base64?: string;
    isCompressing?: boolean;
    compressionError?: string;
    isBase64Open?: boolean;
}

export interface ImageSettings {
    quality: number;
    scale: number;
    format: 'original' | 'jpeg' | 'png' | 'webp';
}

export interface GlobalSettings extends ImageSettings {}

export type ViewMode = 'list' | 'grid';
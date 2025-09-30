import imageCompression from 'browser-image-compression';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { previewImage } from '@/utils/imagePreview';

interface ImageItem {
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
    isCompressing?: boolean;
    compressionError?: string;
}

interface ImageSettings {
    quality: number;
    scale: number;
    format: 'original' | 'jpeg' | 'png' | 'webp';
}

interface GlobalSettings extends ImageSettings {}

const MAX_FILES = 50;
// 补零
const padZero = (num: number) => String(num).padStart(2, '0');

export default function ImageCompressor() {
    const [items, setItems] = useState<ImageItem[]>([]);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
        quality: 80,
        scale: 100,
        format: 'original',
    });
    const [isCompressingAll, setIsCompressingAll] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 添加文件到列表
    const addFiles = (fileList: FileList | File[]) => {
        const files = Array.from(fileList);
        const newItems: ImageItem[] = [];

        files.forEach((file) => {
            if (!file.type.startsWith('image/')) return;
            if (items.length + newItems.length >= MAX_FILES) return;

            const item: ImageItem = {
                id: `${Date.now()}-${Math.random()}`,
                file,
                previewUrl: URL.createObjectURL(file),
                originalSize: file.size,
                settings: { ...globalSettings },
            };

            // 读取图片尺寸
            const img = new Image();
            img.onload = () => {
                setItems((prev) =>
                    prev.map((prevItem) =>
                        prevItem.id === item.id
                            ? { ...prevItem, originalWidth: img.width, originalHeight: img.height }
                            : prevItem
                    )
                );
            };
            img.src = item.previewUrl;

            newItems.push(item);
        });

        setItems((prev) => [...prev, ...newItems]);
    };

    // 处理文件选择
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            addFiles(files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 处理拖拽
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files) {
            addFiles(files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // 格式化文件大小
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 计算调整后的尺寸
    const getAdjustedDimensions = (item: ImageItem) => {
        if (!item.originalWidth || !item.originalHeight) return null;
        const newWidth = Math.round(item.originalWidth * (item.settings.scale / 100));
        const newHeight = Math.round(item.originalHeight * (item.settings.scale / 100));
        return { width: newWidth, height: newHeight };
    };

    // 压缩单个图片
    const compressItem = async (item: ImageItem) => {
        setItems((prev) =>
            prev.map((prevItem) =>
                prevItem.id === item.id ? { ...prevItem, isCompressing: true, compressionError: undefined } : prevItem
            )
        );

        try {
            const options: any = {
                maxWidthOrHeight:
                    item.originalWidth && item.originalHeight
                        ? Math.max(item.originalWidth, item.originalHeight) * (item.settings.scale / 100)
                        : undefined,
                useWebWorker: true,
                initialQuality: item.settings.quality / 100,
            };

            // 设置输出格式
            if (item.settings.format !== 'original') {
                options.fileType = `image/${item.settings.format}`;
            }

            const compressedFile = await imageCompression(item.file, options);
            const compressedUrl = URL.createObjectURL(compressedFile);

            setItems((prev) =>
                prev.map((prevItem) =>
                    prevItem.id === item.id
                        ? {
                              ...prevItem,
                              compressedBlob: compressedFile,
                              compressedUrl,
                              compressedSize: compressedFile.size,
                              isCompressing: false,
                          }
                        : prevItem
                )
            );
        } catch (error) {
            console.error('压缩失败:', error);
            setItems((prev) =>
                prev.map((prevItem) =>
                    prevItem.id === item.id
                        ? {
                              ...prevItem,
                              isCompressing: false,
                              compressionError: '压缩失败，请重试',
                          }
                        : prevItem
                )
            );
        }
    };

    // 批量压缩所有图片
    const compressAll = async () => {
        setIsCompressingAll(true);

        try {
            // 并发压缩所有图片
            await Promise.all(items.map((item) => compressItem(item)));
        } finally {
            setIsCompressingAll(false);
        }
    };

    // 应用全局设置到所有图片
    const applyGlobalSettings = () => {
        setItems((prev) =>
            prev.map((item) => ({
                ...item,
                settings: { ...globalSettings },
            }))
        );
    };

    // 更新单个图片的设置
    const updateItemSettings = (id: string, newSettings: Partial<ImageSettings>) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, settings: { ...item.settings, ...newSettings } } : item))
        );

        // 如果图片已经压缩过，自动重新压缩
        const item = items.find((item) => item.id === id);
        if (item?.compressedBlob) {
            setTimeout(() => {
                const updatedItem = items.find((item) => item.id === id);
                if (updatedItem) {
                    compressItem({ ...updatedItem, settings: { ...updatedItem.settings, ...newSettings } });
                }
            }, 100);
        }
    };

    // 下载单个压缩后的图片
    const downloadItem = (item: ImageItem) => {
        if (!item.compressedBlob) {
            // 如果没有压缩，先压缩再下载
            compressItem(item).then(() => {
                const updatedItem = items.find((i) => i.id === item.id);
                if (updatedItem?.compressedBlob) {
                    const fileName = getDownloadFileName(item);
                    saveAs(updatedItem.compressedBlob, fileName);
                }
            });
            return;
        }

        const fileName = getDownloadFileName(item);
        saveAs(item.compressedBlob, fileName);
    };

    // 获取下载文件名
    const getDownloadFileName = (item: ImageItem) => {
        const originalName = item.file.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const originalExt = originalName.substring(originalName.lastIndexOf('.'));

        let newExt = originalExt;
        if (item.settings.format !== 'original') {
            newExt = `.${item.settings.format === 'jpeg' ? 'jpg' : item.settings.format}`;
        }

        return `${nameWithoutExt}_compressed${newExt}`;
    };

    // 下载所有压缩后的图片为ZIP
    const downloadAllAsZip = async () => {
        const compressedItems = items.filter((item) => item.compressedBlob);
        if (compressedItems.length === 0) return;

        const zip = new JSZip();

        compressedItems.forEach((item) => {
            if (item.compressedBlob) {
                const fileName = getDownloadFileName(item);
                zip.file(fileName, item.compressedBlob);
            }
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `compressed_images_${Date.now()}.zip`);
        } catch (error) {
            console.error('生成 ZIP 失败:', error);
        }
    };

    // 清空所有图片
    const clearAll = () => {
        items.forEach((item) => {
            URL.revokeObjectURL(item.previewUrl);
            if (item.compressedUrl) {
                URL.revokeObjectURL(item.compressedUrl);
            }
        });
        setItems([]);
    };

    // 处理粘贴
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const clipboardItems = e.clipboardData?.items;
            if (!clipboardItems) return;

            const files: File[] = [];
            for (let i = 0; i < clipboardItems.length; i++) {
                const item = clipboardItems[i];
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) files.push(file);
                }
            }

            if (files.length > 0) {
                addFiles(files);
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [items]);

    return (
        <div className="flex flex-col overflow-hidden p-8 bg-background rounded-2xl h-full">
            <div className="flex-shrink-0 p-4 border-b">
                <h1 className="text-2xl font-bold text-foreground mb-1">图片压缩器</h1>
                <p className="text-sm text-muted-foreground">批量压缩图片，最多同时处理 {MAX_FILES} 张</p>
            </div>
            <div className="flex-1 flex overflow-hidden">
                {/* 左侧控制面板 */}
                <div className="w-92 flex-shrink-0 border-r bg-background p-4 space-y-4 overflow-y-auto">
                    {/* 上传区域 */}
                    <Card className="gap-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <i className="i-lucide-upload w-4 h-4"></i>
                                上传图片
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <i className="i-lucide-image-plus w-8 h-8 mx-auto text-muted-foreground/60 mb-2"></i>
                                <p className="text-xs text-muted-foreground mb-1">点击选择或拖拽图片</p>
                                <p className="text-xs text-muted-foreground/70">支持 JPEG、PNG、WebP</p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>按 Ctrl+V 粘贴</span>
                                <span>
                                    {items.length}/{MAX_FILES}
                                </span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearAll}
                                className="w-full h-8"
                                disabled={items.length === 0}
                            >
                                <i className="i-lucide-trash-2 w-3 h-3 mr-1"></i>
                                清空
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 全局设置 */}
                    <Card className="gap-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <i className="i-lucide-settings w-4 h-4"></i>
                                全局设置
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">压缩质量</Label>
                                    <span className="text-xs text-muted-foreground">{globalSettings.quality}%</span>
                                </div>
                                <Slider
                                    value={[globalSettings.quality]}
                                    onValueChange={([value]) =>
                                        setGlobalSettings((prev) => ({ ...prev, quality: value }))
                                    }
                                    max={100}
                                    min={1}
                                    step={1}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">尺寸缩放</Label>
                                    <span className="text-xs text-muted-foreground">{globalSettings.scale}%</span>
                                </div>
                                <Slider
                                    value={[globalSettings.scale]}
                                    onValueChange={([value]) =>
                                        setGlobalSettings((prev) => ({ ...prev, scale: value }))
                                    }
                                    max={100}
                                    min={10}
                                    step={5}
                                    className="w-full"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">输出格式</Label>
                                <Select
                                    value={globalSettings.format}
                                    onValueChange={(value: any) =>
                                        setGlobalSettings((prev) => ({ ...prev, format: value }))
                                    }
                                >
                                    <SelectTrigger size="sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="original">保持原格式</SelectItem>
                                        <SelectItem value="jpeg">JPEG</SelectItem>
                                        <SelectItem value="png">PNG</SelectItem>
                                        <SelectItem value="webp">WebP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-8"
                                    disabled={items.length === 0}
                                    onClick={applyGlobalSettings}
                                >
                                    应用到所有
                                </Button>

                                <Button
                                    size="sm"
                                    className="w-full h-8"
                                    disabled={items.length === 0 || isCompressingAll}
                                    onClick={compressAll}
                                >
                                    {isCompressingAll ? (
                                        <>
                                            <i className="i-lucide-loader-2 w-3 h-3 mr-1 animate-spin"></i>
                                            压缩中
                                        </>
                                    ) : (
                                        <>
                                            <i className="i-lucide-zap w-3 h-3 mr-1"></i>
                                            批量压缩
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={downloadAllAsZip}
                                    variant="secondary"
                                    size="sm"
                                    className="w-full h-8"
                                    disabled={!items.some((item) => item.compressedBlob)}
                                >
                                    <i className="i-lucide-download w-3 h-3 mr-1"></i>
                                    下载 ZIP
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 右侧图片列表 */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 p-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <i className="i-lucide-images w-4 h-4"></i>
                                <span className="font-medium">图片列表 </span>
                                <span className="text-xs text-muted-foreground">
                                    ({items.length}/{MAX_FILES})
                                </span>
                            </div>
                            {/* <span className="text-sm text-muted-foreground">点击预览</span> */}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <i className="i-lucide-image-off w-12 h-12 text-muted-foreground/40 mb-3"></i>
                                <p className="text-muted-foreground mb-1">暂无图片</p>
                                <p className="text-sm text-muted-foreground/70">上传、拖拽或粘贴开始</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item) => {
                                    const adjustedDimensions = getAdjustedDimensions(item);

                                    return (
                                        <div
                                            key={item.id}
                                            className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
                                        >
                                            <div className="flex gap-3">
                                                {/* 缩略图 */}
                                                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                                    <img
                                                        src={item.compressedUrl || item.previewUrl}
                                                        alt={item.file.name}
                                                        className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() =>
                                                            previewImage(
                                                                item.compressedUrl || item.previewUrl,
                                                                item.file.name
                                                            )
                                                        }
                                                    />
                                                    {/* 压缩按钮和状态 */}
                                                    <div className="flex items-center text-xs">
                                                        {item.isCompressing ? (
                                                            <>
                                                                <i className="i-lucide-loader-2 w-3 h-3 mr-1 animate-spin"></i>
                                                                压缩中
                                                            </>
                                                        ) : item.compressedBlob ? (
                                                            <>
                                                                <i className="i-lucide-check w-3 h-3 mr-1 text-success"></i>
                                                                完成
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="i-lucide-zap w-3 h-3 mr-1"></i>
                                                                待压缩
                                                            </>
                                                        )}

                                                        {item.compressionError && (
                                                            <span className="text-xs text-destructive">
                                                                {item.compressionError}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 信息和控制 */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="text-sm font-medium truncate">
                                                                {item.file.name}
                                                            </h4>
                                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                                                <div className="flex items-center gap-4">
                                                                    <span>
                                                                        原始:{' '}
                                                                        {item.originalWidth && item.originalHeight
                                                                            ? `${item.originalWidth} × ${item.originalHeight}`
                                                                            : '未知'}{' '}
                                                                        · {formatBytes(item.originalSize)}
                                                                    </span>
                                                                    {adjustedDimensions &&
                                                                        item.settings.scale !== 100 && (
                                                                            <span className="text-blue-600">
                                                                                缩放后: {adjustedDimensions.width} ×{' '}
                                                                                {adjustedDimensions.height}
                                                                            </span>
                                                                        )}
                                                                </div>
                                                                {item.compressedSize && (
                                                                    <div className="text-green-600">
                                                                        压缩后: {formatBytes(item.compressedSize)}(
                                                                        {Math.round(
                                                                            (1 -
                                                                                item.compressedSize /
                                                                                    item.originalSize) *
                                                                                100
                                                                        )}
                                                                        % 减少)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 ml-2">
                                                            <button
                                                                onClick={() => downloadItem(item)}
                                                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                            >
                                                                下载
                                                            </button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setItems((prev) =>
                                                                        prev.filter((i) => i.id !== item.id)
                                                                    )
                                                                }
                                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <i className="i-lucide-x w-3 h-3"></i>
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* 单独控制面板 */}
                                                    <div className="grid grid-cols-3 gap-2 items-end">
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground">
                                                                质量 {item.settings.quality}%
                                                            </Label>
                                                            <Slider
                                                                value={[item.settings.quality]}
                                                                onValueChange={([value]) =>
                                                                    updateItemSettings(item.id, { quality: value })
                                                                }
                                                                max={100}
                                                                min={1}
                                                                step={1}
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground">
                                                                尺寸 {item.settings.scale}%
                                                            </Label>
                                                            <Slider
                                                                value={[item.settings.scale]}
                                                                onValueChange={([value]) =>
                                                                    updateItemSettings(item.id, { scale: value })
                                                                }
                                                                max={100}
                                                                min={10}
                                                                step={5}
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Label className="text-xs text-muted-foreground">
                                                                格式
                                                            </Label>
                                                            <Select
                                                                value={item.settings.format}
                                                                onValueChange={(value: any) =>
                                                                    updateItemSettings(item.id, { format: value })
                                                                }
                                                            >
                                                                <SelectTrigger size="sm" className="text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="original">原格式</SelectItem>
                                                                    <SelectItem value="jpeg">JPEG</SelectItem>
                                                                    <SelectItem value="png">PNG</SelectItem>
                                                                    <SelectItem value="webp">WebP</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

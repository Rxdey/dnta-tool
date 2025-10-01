import { AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { ControlPanel } from './components/ControlPanel';
import { ImageGridItem } from './components/ImageGridItem';
import { ImageListItem } from './components/ImageListItem';
import type { ImageItem, ImageSettings, GlobalSettings } from './types';

const MAX_FILES = 50;

// 截断文件名显示
const truncateFileName = (fileName: string, maxLength: number = 30) => {
    if (fileName.length <= maxLength) return fileName;
    
    const dotIndex = fileName.lastIndexOf('.');
    const ext = dotIndex > -1 ? fileName.substring(dotIndex) : '';
    const nameWithoutExt = dotIndex > -1 ? fileName.substring(0, dotIndex) : fileName;
    
    const availableLength = maxLength - ext.length - 3; // 3 for "..."
    if (availableLength <= 0) return fileName;
    
    const frontLength = Math.ceil(availableLength * 0.6);
    const backLength = Math.floor(availableLength * 0.4);
    
    return `${nameWithoutExt.substring(0, frontLength)}...${nameWithoutExt.substring(nameWithoutExt.length - backLength)}${ext}`;
};

export default function ImageCompressor() {
    const [items, setItems] = useState<ImageItem[]>([]);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
        quality: 80,
        scale: 100,
        format: 'original',
    });
    const [isCompressingAll, setIsCompressingAll] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    // 压缩单个图片并生成base64
    const compressItem = async (item: ImageItem, generateBase64: boolean = false) => {
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

            // 生成base64（如果需要）
            let base64 = '';
            if (generateBase64) {
                const reader = new FileReader();
                base64 = await new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(compressedFile);
                });
            }

            setItems((prev) =>
                prev.map((prevItem) =>
                    prevItem.id === item.id
                        ? {
                              ...prevItem,
                              compressedBlob: compressedFile,
                              compressedUrl,
                              compressedSize: compressedFile.size,
                              base64: generateBase64 ? base64 : prevItem.base64,
                              isCompressing: false,
                          }
                        : prevItem
                )
            );
            
            // 成功提示
            const compressionRatio = Math.round((1 - compressedFile.size / item.file.size) * 100);
            if (generateBase64) {
                toast.success(`${truncateFileName(item.file.name)} 压缩并转换Base64完成！压缩率: ${compressionRatio}%`);
            } else {
                toast.success(`${truncateFileName(item.file.name)} 压缩完成！压缩率: ${compressionRatio}%`);
            }
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
    const compressAll = async (generateBase64: boolean = false) => {
        setIsCompressingAll(true);
        const action = generateBase64 ? '压缩并转换Base64' : '批量压缩';
        toast.info(`开始${action}${items.length}张图片...`);

        try {
            // 并发压缩所有图片
            await Promise.all(items.map((item) => compressItem(item, generateBase64)));
            toast.success(`${action}完成！共处理${items.length}张图片`);
        } catch (error) {
            toast.error(`${action}失败，请重试`);
        } finally {
            setIsCompressingAll(false);
        }
    };

    // 批量生成base64（压缩+转换）
    const compressAndConvertToBase64 = () => {
        compressAll(true);
    };

    // 更新全局设置
    const updateGlobalSettings = (newSettings: Partial<ImageSettings>) => {
        setGlobalSettings(prev => ({ ...prev, ...newSettings }));
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
            prev.map((item) => (item.id === id ? { 
                ...item, 
                settings: { ...item.settings, ...newSettings },
                // 重置压缩状态，需要重新压缩
                compressedBlob: undefined,
                compressedUrl: undefined,
                compressedSize: undefined,
                base64: undefined,
                isBase64Open: false
            } : item))
        );
    };

    // 下载单个压缩后的图片
    const downloadItem = (item: ImageItem) => {
        if (!item.compressedBlob) {
            // 如果没有压缩，先压缩再下载
            toast.info('正在压缩图片...');
            compressItem(item, false).then(() => {
                const updatedItem = items.find((i) => i.id === item.id);
                if (updatedItem?.compressedBlob) {
                    const fileName = getDownloadFileName(item);
                    saveAs(updatedItem.compressedBlob, fileName);
                    toast.success(`已下载 ${fileName}`);
                }
            });
            return;
        }

        const fileName = getDownloadFileName(item);
        saveAs(item.compressedBlob, fileName);
        toast.success(`已下载 ${fileName}`);
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

        toast.info(`正在打包${compressedItems.length}张图片...`);
        
        const zip = new JSZip();

        compressedItems.forEach((item) => {
            if (item.compressedBlob) {
                const fileName = getDownloadFileName(item);
                zip.file(fileName, item.compressedBlob);
            }
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const zipFileName = `compressed_images_${Date.now()}.zip`;
            saveAs(content, zipFileName);
            toast.success(`已下载压缩包: ${zipFileName}`);
        } catch (error) {
            console.error('生成 ZIP 失败:', error);
            toast.error('生成ZIP文件失败，请重试');
        }
    };

    // 删除单个图片
    const removeItem = (id: string) => {
        const item = items.find(i => i.id === id);
        if (item) {
            URL.revokeObjectURL(item.previewUrl);
            if (item.compressedUrl) {
                URL.revokeObjectURL(item.compressedUrl);
            }
        }
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast.success('已删除图片');
    };

    // 清空所有图片
    const clearAll = () => {
        if (items.length === 0) return;
        
        items.forEach((item) => {
            URL.revokeObjectURL(item.previewUrl);
            if (item.compressedUrl) {
                URL.revokeObjectURL(item.compressedUrl);
            }
        });
        setItems([]);
        toast.success(`已清空所有${items.length}张图片`);
    };

    // 复制base64到剪贴板
    const copyBase64 = async (item: ImageItem) => {
        if (item.base64) {
            try {
                await navigator.clipboard.writeText(item.base64);
                toast.success(`已复制 ${truncateFileName(item.file.name)} 的Base64编码`);
            } catch (error) {
                toast.error('复制失败，请重试');
            }
        }
    };

    // 切换base64面板显示
    const toggleBase64Panel = (id: string) => {
        setItems((prev) =>
            prev.map((item) => 
                item.id === id 
                    ? { ...item, isBase64Open: !item.isBase64Open }
                    : item
            )
        );
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
        <div className="flex flex-col overflow-hidden p-8 bg-background rounded-2xl h-full max-w-full">
            <div className="flex-shrink-0 p-4 border-b">
                <h1 className="text-2xl font-bold text-foreground mb-1">图片压缩器</h1>
                <p className="text-sm text-muted-foreground">批量压缩图片，最多同时处理 {MAX_FILES} 张</p>
            </div>
            <div className="flex-1 flex overflow-hidden min-w-0">
                {/* 左侧控制面板 */}
                <ControlPanel
                    globalSettings={globalSettings}
                    onGlobalSettingsChange={updateGlobalSettings}
                    onApplyGlobalSettings={applyGlobalSettings}
                    onCompressAll={() => compressAll(false)}
                    onCompressAndConvertToBase64={compressAndConvertToBase64}
                    onDownloadAllAsZip={downloadAllAsZip}
                    onClearAll={clearAll}
                    itemsCount={items.length}
                    maxFiles={MAX_FILES}
                    isCompressingAll={isCompressingAll}
                    hasCompressedItems={items.some((item) => item.compressedBlob)}
                    fileInputRef={fileInputRef}
                    onFileSelect={handleFileSelect}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                />

                {/* 右侧图片列表 */}
                <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                    <div className="flex-shrink-0 p-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <i className="i-lucide-images w-4 h-4"></i>
                                <span className="font-medium">图片列表 </span>
                                <span className="text-xs text-muted-foreground">
                                    ({items.length}/{MAX_FILES})
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">布局:</span>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="h-6 w-6 p-0"
                                >
                                    <i className="i-lucide-list w-3 h-3"></i>
                                </Button>
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className="h-6 w-6 p-0"
                                >
                                    <i className="i-lucide-grid-3x3 w-3 h-3"></i>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4" style={{ scrollbarWidth: 'thin' }}>
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <i className="i-lucide-image-off w-12 h-12 text-muted-foreground/40 mb-3"></i>
                                <p className="text-muted-foreground mb-1">暂无图片</p>
                                <p className="text-sm text-muted-foreground/70">上传、拖拽或粘贴开始</p>
                            </div>
                        ) : viewMode === 'list' ? (
                            <AnimatePresence>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <ImageListItem
                                            key={item.id}
                                            item={item}
                                            onUpdateSettings={updateItemSettings}
                                            onCompress={compressItem}
                                            onDownload={downloadItem}
                                            onRemove={removeItem}
                                            onCopyBase64={copyBase64}
                                            onToggleBase64Panel={toggleBase64Panel}
                                            formatBytes={formatBytes}
                                            truncateFileName={truncateFileName}
                                            getAdjustedDimensions={getAdjustedDimensions}
                                        />
                                    ))}
                                </div>
                            </AnimatePresence>
                        ) : (
                            /* Grid 视图 */
                            <AnimatePresence>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {items.map((item) => (
                                        <ImageGridItem
                                            key={item.id}
                                            item={item}
                                            onUpdateSettings={updateItemSettings}
                                            onCompress={compressItem}
                                            onDownload={downloadItem}
                                            onRemove={removeItem}
                                            onCopyBase64={copyBase64}
                                            onToggleBase64Panel={toggleBase64Panel}
                                            formatBytes={formatBytes}
                                            truncateFileName={truncateFileName}
                                            getAdjustedDimensions={getAdjustedDimensions}
                                        />
                                    ))}
                                </div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
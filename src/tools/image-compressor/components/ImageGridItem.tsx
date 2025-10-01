import { motion } from 'framer-motion';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
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
    base64?: string;
    isCompressing?: boolean;
    compressionError?: string;
    isBase64Open?: boolean;
}

interface ImageSettings {
    quality: number;
    scale: number;
    format: 'original' | 'jpeg' | 'png' | 'webp';
}

interface ImageGridItemProps {
    item: ImageItem;
    onUpdateSettings: (id: string, settings: Partial<ImageSettings>) => void;
    onCompress: (item: ImageItem, generateBase64: boolean) => Promise<void>;
    onDownload: (item: ImageItem) => void;
    onRemove: (id: string) => void;
    onCopyBase64: (item: ImageItem) => void;
    onToggleBase64Panel: (id: string) => void;
    formatBytes: (bytes: number) => string;
    truncateFileName: (fileName: string, maxLength?: number) => string;
    getAdjustedDimensions: (item: ImageItem) => { width: number; height: number } | null;
}

export const ImageGridItem: React.FC<ImageGridItemProps> = ({
    item,
    onUpdateSettings,
    onCompress,
    onDownload,
    onRemove,
    onCopyBase64,
    onToggleBase64Panel,
    formatBytes,
    truncateFileName,
    getAdjustedDimensions,
}) => {
    const adjustedDimensions = getAdjustedDimensions(item);

    return (
        <motion.div
            layout="position"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            <Card className="hover:shadow-md transition-shadow min-w-64 max-w-80">
                <CardContent className="p-4">
                    {/* 图片预览 */}
                    <div className="relative mb-3">
                        <img
                            src={item.compressedUrl || item.previewUrl}
                            alt={item.file.name}
                            className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                                previewImage(
                                    item.compressedUrl || item.previewUrl,
                                    item.file.name
                                )
                            }
                        />
                        <div className="absolute top-2 right-2">
                            {item.isCompressing ? (
                                <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                                    <i className="i-lucide-loader-2 w-3 h-3 animate-spin mr-1"></i>
                                    处理中
                                </div>
                            ) : item.compressedBlob ? (
                                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                                    <i className="i-lucide-check w-3 h-3 mr-1"></i>
                                    完成
                                </div>
                            ) : (
                                <div className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                                    <i className="i-lucide-clock w-3 h-3 mr-1"></i>
                                    待处理
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* 文件信息 */}
                    <div className="mb-3">
                        <h4 className="text-sm font-medium mb-2 truncate" title={item.file.name}>
                            {truncateFileName(item.file.name, 25)}
                        </h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                                <span>原始:</span>
                                <span>
                                    {item.originalWidth && item.originalHeight
                                        ? `${item.originalWidth}×${item.originalHeight}`
                                        : '未知'} · {formatBytes(item.originalSize)}
                                </span>
                            </div>
                            {item.compressedSize ? (
                                <div className="flex justify-between text-green-600">
                                    <span>压缩:</span>
                                    <span>
                                        {formatBytes(item.compressedSize)} ({Math.round((1 - item.compressedSize / item.originalSize) * 100)}% ↓)
                                    </span>
                                </div>
                            ) : (
                                <div className="h-4"></div>
                            )}
                            {adjustedDimensions && item.settings.scale !== 100 ? (
                                <div className="flex justify-between text-blue-600">
                                    <span>尺寸:</span>
                                    <span>{adjustedDimensions.width}×{adjustedDimensions.height}</span>
                                </div>
                            ) : (
                                <div className="h-4"></div>
                            )}
                        </div>
                    </div>
                    
                    {/* 紧凑控制 */}
                    <div className="space-y-3 mb-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground block mb-1">
                                    质量 {item.settings.quality}%
                                </Label>
                                <Slider
                                    value={[item.settings.quality]}
                                    onValueChange={([value]) =>
                                        onUpdateSettings(item.id, { quality: value })
                                    }
                                    max={100}
                                    min={1}
                                    step={1}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground block mb-1">
                                    尺寸 {item.settings.scale}%
                                </Label>
                                <Slider
                                    value={[item.settings.scale]}
                                    onValueChange={([value]) =>
                                        onUpdateSettings(item.id, { scale: value })
                                    }
                                    max={100}
                                    min={10}
                                    step={5}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <Select
                            value={item.settings.format}
                            onValueChange={(value: any) =>
                                onUpdateSettings(item.id, { format: value })
                            }
                        >
                            <SelectTrigger size="sm" className="text-xs h-8">
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
                    
                    {/* 操作按钮 */}
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            {!item.compressedBlob && !item.isCompressing ? (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => onCompress(item, false)}
                                    className="flex-1 h-8 text-xs"
                                >
                                    <i className="i-lucide-zap w-3 h-3 mr-1"></i>
                                    压缩
                                </Button>
                            ) : (
                                <>
                                    {item.compressedBlob && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (!item.base64) {
                                                    onCompress(item, true);
                                                } else {
                                                    onCopyBase64(item);
                                                }
                                            }}
                                            className="flex-1 h-8 text-xs"
                                            disabled={item.isCompressing}
                                        >
                                            <i className="i-lucide-copy w-3 h-3 mr-1"></i>
                                            {item.base64 ? '复制' : 'Base64'}
                                        </Button>
                                    )}
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDownload(item)}
                                        className="flex-1 h-8 text-xs"
                                        disabled={item.isCompressing}
                                    >
                                        <i className="i-lucide-download w-3 h-3 mr-1"></i>
                                        下载
                                    </Button>
                                </>
                            )}
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(item.id)}
                                className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive"
                            >
                                <i className="i-lucide-trash-2 w-3 h-3"></i>
                            </Button>
                        </div>
                        
                        {/* Base64面板切换 - 移到操作区域 */}
                        {item.base64 && (
                            <Collapsible open={item.isBase64Open} onOpenChange={() => onToggleBase64Panel(item.id)}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
                                        <i className={`w-3 h-3 mr-1 ${item.isBase64Open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'}`}></i>
                                        Base64编码
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2 overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <Textarea
                                            value={item.base64}
                                            readOnly
                                            className="min-h-20 max-h-24 text-xs font-mono resize-none w-full max-w-full box-border break-all"
                                            placeholder="Base64编码..."
                                            style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
                                        />
                                    </motion.div>
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
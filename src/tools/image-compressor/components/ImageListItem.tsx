import { motion } from 'framer-motion';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
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

interface ImageListItemProps {
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

export const ImageListItem: React.FC<ImageListItemProps> = ({
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="border rounded-lg hover:shadow-sm transition-shadow"
        >
            <div className="p-4">
                <div className="flex gap-4">
                    {/* 缩略图 - 增大尺寸 */}
                    <div className="flex-shrink-0">
                        <img
                            src={item.compressedUrl || item.previewUrl}
                            alt={item.file.name}
                            className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                                previewImage(
                                    item.compressedUrl || item.previewUrl,
                                    item.file.name
                                )
                            }
                        />
                    </div>

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0 max-w-72">
                        <h4 className="text-sm font-medium mb-2" title={item.file.name}>
                            {truncateFileName(item.file.name)}
                        </h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-4">
                                <span>
                                    原始: {item.originalWidth && item.originalHeight
                                        ? `${item.originalWidth}×${item.originalHeight}`
                                        : '未知'} · {formatBytes(item.originalSize)}
                                </span>
                                {item.compressedSize && (
                                    <span className="text-green-600">
                                        压缩: {formatBytes(item.compressedSize)} ({Math.round((1 - item.compressedSize / item.originalSize) * 100)}% ↓)
                                    </span>
                                )}
                            </div>
                            {adjustedDimensions && item.settings.scale !== 100 ? (
                                <div className="text-blue-600">
                                    缩放后尺寸: {adjustedDimensions.width}×{adjustedDimensions.height}
                                </div>
                            ) : (
                                // 占位符，保持布局一致
                                <div className="h-4"></div>
                            )}
                        </div>
                    </div>

                    {/* 质量和尺寸控制 - 增大滑块长度 */}
                    <div className="flex-1 min-w-60 max-w-80">
                        <div className="grid grid-cols-2 gap-4 mb-3">
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
                            <SelectTrigger size="sm" className="text-xs h-7">
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

                    {/* 操作按钮区域 */}
                    <div className="flex flex-col gap-1 items-end min-w-40">
                        <div className="flex items-center gap-1">
                            {/* 状态指示 */}
                            <div className="text-xs flex items-center mr-2">
                                {item.isCompressing ? (
                                    <>
                                        <i className="i-lucide-loader-2 w-4 h-4 animate-spin text-blue-500 mr-1"></i>
                                        <span className="text-blue-600">处理中</span>
                                    </>
                                ) : item.compressedBlob ? (
                                    <>
                                        <i className="i-lucide-check w-4 h-4 text-green-500 mr-1"></i>
                                        <span className="text-green-600">已完成</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="i-lucide-clock w-4 h-4 text-gray-400 mr-1"></i>
                                        <span className="text-gray-500">待处理</span>
                                    </>
                                )}
                            </div>
                            
                            {/* Base64面板切换按钮 - 移到操作按钮这排 */}
                            {item.base64 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onToggleBase64Panel(item.id)}
                                    className="h-7 px-2 text-xs"
                                >
                                    <i className={`w-3 h-3 mr-1 ${item.isBase64Open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'}`}></i>
                                    Base64
                                </Button>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                            {/* 单独压缩按钮 */}
                            {!item.compressedBlob && !item.isCompressing && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onCompress(item, false)}
                                    className="h-7 px-3 text-xs"
                                >
                                    <i className="i-lucide-zap w-3 h-3 mr-1"></i>
                                    压缩
                                </Button>
                            )}
                            
                            {/* Base64按钮 */}
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
                                    className="h-7 px-3 text-xs"
                                    disabled={item.isCompressing}
                                >
                                    <i className="i-lucide-copy w-3 h-3 mr-1"></i>
                                    {item.base64 ? '复制' : 'Base64'}
                                </Button>
                            )}
                            
                            {/* 下载按钮 */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDownload(item)}
                                className="h-7 px-3 text-xs"
                                disabled={item.isCompressing}
                            >
                                <i className="i-lucide-download w-3 h-3 mr-1"></i>
                                下载
                            </Button>
                            
                            {/* 删除按钮 */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(item.id)}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                            >
                                <i className="i-lucide-trash-2 w-3 h-3"></i>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Base64折叠面板 - 限制最大宽度 */}
            {item.base64 && (
                <Collapsible open={item.isBase64Open} onOpenChange={() => onToggleBase64Panel(item.id)}>
                    <CollapsibleContent className="px-4 pb-4 overflow-hidden">
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="border-t pt-3"
                            style={{ overflow: 'hidden' }}
                        >
                            <Label className="text-xs text-muted-foreground mb-2 block">Base64编码</Label>
                            <div className="w-full overflow-hidden">
                                <Textarea
                                    value={item.base64}
                                    readOnly
                                    className="min-h-24 max-h-40 text-xs font-mono resize-none w-full max-w-full box-border break-all"
                                    placeholder="Base64编码将显示在这里..."
                                    style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
                                />
                            </div>
                        </motion.div>
                    </CollapsibleContent>
                </Collapsible>
            )}
        </motion.div>
    );
};
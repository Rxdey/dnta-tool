import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface ImageSettings {
    quality: number;
    scale: number;
    format: 'original' | 'jpeg' | 'png' | 'webp';
}

interface ControlPanelProps {
    globalSettings: ImageSettings;
    onGlobalSettingsChange: (settings: Partial<ImageSettings>) => void;
    onApplyGlobalSettings: () => void;
    onCompressAll: () => void;
    onCompressAndConvertToBase64: () => void;
    onDownloadAllAsZip: () => void;
    onClearAll: () => void;
    itemsCount: number;
    maxFiles: number;
    isCompressingAll: boolean;
    hasCompressedItems: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    globalSettings,
    onGlobalSettingsChange,
    onApplyGlobalSettings,
    onCompressAll,
    onCompressAndConvertToBase64,
    onDownloadAllAsZip,
    onClearAll,
    itemsCount,
    maxFiles,
    isCompressingAll,
    hasCompressedItems,
    fileInputRef,
    onFileSelect,
    onDrop,
    onDragOver,
}) => {
    return (
        <div className="w-92 min-w-80 flex-shrink-0 border-r bg-background p-4 space-y-4 overflow-y-auto">
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
                        onDrop={onDrop}
                        onDragOver={onDragOver}
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
                        onChange={onFileSelect}
                        className="hidden"
                    />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>按 Ctrl+V 粘贴</span>
                        <span>
                            {itemsCount}/{maxFiles}
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearAll}
                        className="w-full h-8"
                        disabled={itemsCount === 0}
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
                                onGlobalSettingsChange({ quality: value })
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
                                onGlobalSettingsChange({ scale: value })
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
                                onGlobalSettingsChange({ format: value })
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
                            disabled={itemsCount === 0}
                            onClick={onApplyGlobalSettings}
                        >
                            应用到所有
                        </Button>

                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                className="flex-1 h-8"
                                disabled={itemsCount === 0 || isCompressingAll}
                                onClick={onCompressAll}
                            >
                                {isCompressingAll ? (
                                    <>
                                        <i className="i-lucide-loader-2 w-3 h-3 mr-1 animate-spin"></i>
                                        处理中
                                    </>
                                ) : (
                                    <>
                                        <i className="i-lucide-zap w-3 h-3 mr-1"></i>
                                        批量压缩
                                    </>
                                )}
                            </Button>
                            
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8"
                                disabled={itemsCount === 0 || isCompressingAll}
                                onClick={onCompressAndConvertToBase64}
                            >
                                {isCompressingAll ? (
                                    <>
                                        <i className="i-lucide-loader-2 w-3 h-3 mr-1 animate-spin"></i>
                                        处理中
                                    </>
                                ) : (
                                    <>
                                        <i className="i-lucide-code w-3 h-3 mr-1"></i>
                                        转Base64
                                    </>
                                )}
                            </Button>
                        </div>

                        <Button
                            onClick={onDownloadAllAsZip}
                            variant="secondary"
                            size="sm"
                            className="w-full h-8"
                            disabled={!hasCompressedItems}
                        >
                            <i className="i-lucide-download w-3 h-3 mr-1"></i>
                            下载 ZIP
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
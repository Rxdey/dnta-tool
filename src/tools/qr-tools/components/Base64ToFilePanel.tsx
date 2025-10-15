import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { detectBase64FileType, downloadBase64AsFile, formatFileSize } from '../utils/fileUtils';

// 常用文件类型
const COMMON_EXTENSIONS = [
    { value: 'auto', label: '自动检测', mimeType: '' },
    { value: 'jpg', label: 'JPG 图片', mimeType: 'image/jpeg' },
    { value: 'png', label: 'PNG 图片', mimeType: 'image/png' },
    { value: 'gif', label: 'GIF 图片', mimeType: 'image/gif' },
    { value: 'webp', label: 'WebP 图片', mimeType: 'image/webp' },
    { value: 'pdf', label: 'PDF 文档', mimeType: 'application/pdf' },
    { value: 'txt', label: '文本文件', mimeType: 'text/plain' },
    { value: 'json', label: 'JSON 文件', mimeType: 'application/json' },
    { value: 'xml', label: 'XML 文件', mimeType: 'application/xml' },
    { value: 'zip', label: 'ZIP 压缩', mimeType: 'application/zip' },
    { value: 'mp4', label: 'MP4 视频', mimeType: 'video/mp4' },
    { value: 'mp3', label: 'MP3 音频', mimeType: 'audio/mpeg' },
];

export function Base64ToFilePanel() {
    const [base64Input, setBase64Input] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [filename, setFilename] = useState('');
    const [customExtension, setCustomExtension] = useState('auto');

    // 自动检测文件信息
    const detectFileInfo = (base64: string) => {
        if (!base64.trim()) return null;

        try {
            const { extension, mimeType } = detectBase64FileType(base64);
            const estimatedSize = base64.length * 0.75; // Base64大约比原文件大33%

            return {
                extension,
                mimeType,
                estimatedSize,
            };
        } catch (error) {
            return null;
        }
    };

    const fileInfo = detectFileInfo(base64Input);

    const handleDownload = async () => {
        if (!base64Input.trim()) {
            toast.error('请输入 Base64 内容');
            return;
        }

        setIsLoading(true);
        try {
            let extension: string;
            let mimeType: string;

            // 使用自定义扩展名或自动检测
            if (customExtension === 'auto') {
                const info = detectFileInfo(base64Input);
                if (!info) {
                    toast.error('无法识别 Base64 格式，请手动选择文件类型');
                    setIsLoading(false);
                    return;
                }
                extension = info.extension;
                mimeType = info.mimeType;
            } else {
                const selected = COMMON_EXTENSIONS.find((e) => e.value === customExtension);
                extension = customExtension;
                mimeType = selected?.mimeType || 'application/octet-stream';
            }

            const finalFilename = filename.trim() || `converted_${Date.now()}.${extension}`;

            downloadBase64AsFile(base64Input, finalFilename, mimeType);

            toast.success('文件下载成功', {
                description: `文件名: ${finalFilename}`,
            });
        } catch (error) {
            console.error('下载失败:', error);
            toast.error('下载失败', {
                description: error instanceof Error ? error.message : '未知错误',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setBase64Input(text);
            toast.success('已从剪贴板粘贴内容');
        } catch (error) {
            toast.error('粘贴失败', {
                description: '请手动粘贴或检查剪贴板权限',
            });
        }
    };

    const handleClear = () => {
        setBase64Input('');
        setFilename('');
        setCustomExtension('auto');
        toast.success('已清空内容');
    };

    return (
        <div className="max-w-4xl mx-auto h-full">
            <Card className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <i className="i-lucide-file-output text-xl" />
                            Base64 转文件
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">将 Base64 编码转换为文件并下载</p>
                    </div>

                    {/* Base64 输入区域 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="base64-input">Base64 内容</Label>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={handlePaste} className="h-7 text-xs">
                                    <i className="i-lucide-clipboard mr-1" />
                                    粘贴
                                </Button>
                                {base64Input && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClear}
                                        className="h-7 text-xs text-destructive hover:text-destructive"
                                    >
                                        <i className="i-lucide-x mr-1" />
                                        清空
                                    </Button>
                                )}
                            </div>
                        </div>
                        <Textarea
                            id="base64-input"
                            placeholder="在此粘贴 Base64 编码内容...&#10;支持带前缀 (data:image/png;base64,...) 或纯 Base64 字符串"
                            value={base64Input}
                            onChange={(e) => setBase64Input(e.target.value)}
                            className="resize-none min-h-[200px] max-h-[200px] font-mono text-xs break-all"
                        />
                    </div>

                    {/* 文件类型和文件名 - 一排显示 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 文件类型选择 */}
                        <div className="space-y-2">
                            <Label htmlFor="extension-select">文件类型</Label>
                            <Select value={customExtension} onValueChange={setCustomExtension}>
                                <SelectTrigger id="extension-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMMON_EXTENSIONS.map((ext) => (
                                        <SelectItem key={ext.value} value={ext.value}>
                                            {ext.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {customExtension === 'auto' ? '将自动检测 Base64 格式' : '使用选中的文件类型'}
                            </p>
                        </div>

                        {/* 文件名输入 */}
                        <div className="space-y-2">
                            <Label htmlFor="filename-input">
                                文件名 <span className="text-xs text-muted-foreground">(可选)</span>
                            </Label>
                            <Input
                                id="filename-input"
                                placeholder={fileInfo ? `converted_file.${fileInfo.extension}` : 'converted_file'}
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">留空将自动生成文件名</p>
                        </div>
                    </div>

                    {/* 检测到的文件信息 */}
                    {/* {fileInfo && ( */}
                    <div className="bg-muted/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <i className="i-lucide-info text-lg" />
                            检测到的文件信息
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="space-y-1">
                                <div className="text-muted-foreground text-xs">检测类型</div>
                                <Badge variant="secondary">{fileInfo?.extension.toUpperCase() || '-'}</Badge>
                            </div>
                            <div className="space-y-1">
                                <div className="text-muted-foreground text-xs">MIME 类型</div>
                                <div className="text-xs truncate">{fileInfo?.mimeType || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-muted-foreground text-xs">预估大小</div>
                                <Badge variant="secondary">{formatFileSize(fileInfo?.estimatedSize || 0)}</Badge>
                            </div>
                        </div>
                    </div>
                    {/* )} */}

                    {!fileInfo && base64Input.trim() && (
                        <div className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                            <i className="i-lucide-alert-circle" />
                            无法自动检测类型，请手动选择文件类型
                        </div>
                    )}

                    {/* 下载按钮 */}
                    <Button
                        onClick={handleDownload}
                        disabled={!base64Input.trim() || isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                处理中...
                            </>
                        ) : (
                            <>
                                <i className="i-lucide-download mr-2" />
                                下载文件
                            </>
                        )}
                    </Button>

                    {/* 提示信息 */}
                    <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
                        <p>• 支持所有类型的 Base64 编码</p>
                        <p>• 可自动识别文件类型</p>
                        <p>• 支持带前缀或纯 Base64 字符串</p>
                        <p>• 转换后将直接下载文件</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

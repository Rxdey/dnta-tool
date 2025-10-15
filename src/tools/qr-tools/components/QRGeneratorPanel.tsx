import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { previewQRImages } from '@/utils/imagePreview';

import type { QRFile } from '../types';
import { downloadAllQRCodes, downloadQRCode, generateQRCodes } from '../utils/qrcode';

export function QRGeneratorPanel() {
    const [text, setText] = useState('');
    const [joinLines, setJoinLines] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [qrFiles, setQrFiles] = useState<QRFile[]>([]);

    // 实时计算文本长度和处理后的文本信息
    const processedText = joinLines
        ? text.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\s+/g, ' ').trim()
        : text;

    const originalLines = text.split(/\r\n|\n|\r/).length;
    const originalLength = text.length;
    const processedLength = processedText.length;
    const compressionRatio =
        originalLength > 0 ? (((originalLength - processedLength) / originalLength) * 100).toFixed(1) : '0';

    // 预估二维码数量（每个QR码约2200字节）
    const getByteLength = (str: string) => new TextEncoder().encode(str).length;
    const estimatedQRCount = Math.ceil(getByteLength(processedText) / 2200);

    const handleGenerate = async () => {
        if (!processedText.trim()) {
            toast.error('请输入要生成二维码的文本');
            return;
        }

        setIsLoading(true);
        try {
            const files = await generateQRCodes(processedText);
            setQrFiles(files);
            toast.success(`成功生成 ${files.length} 个二维码`);
        } catch (error) {
            const message = error instanceof Error ? error.message : '生成二维码时出错';
            toast.error(message);
            console.error('QR generation error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreview = (index: number) => {
        previewQRImages(qrFiles, index);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* 左侧：输入区域 */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <i className="i-lucide-qr-code text-xl" />
                            文本转二维码
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">将文本内容转换为二维码图片</p>
                    </div>

                    {/* 文本输入区域 */}
                    <div className="space-y-2">
                        <Label htmlFor="text-input">文本内容</Label>
                        <Textarea
                            id="text-input"
                            placeholder="在此输入要生成二维码的文本内容..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="resize-none min-h-[200px] max-h-[200px] overflow-y-auto"
                        />
                    </div>

                    {/* 实时文本统计 */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">行数:</span>
                                <Badge variant="secondary">{originalLines}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">字符数:</span>
                                <Badge variant="secondary">{originalLength}</Badge>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">字节数:</span>
                                <Badge variant="secondary">{getByteLength(processedText)}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">预估QR数:</span>
                                <Badge variant={estimatedQRCount > 10 ? 'destructive' : 'secondary'}>
                                    {estimatedQRCount}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* 压缩选项 */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="join-lines"
                                checked={joinLines}
                                onCheckedChange={(checked) => setJoinLines(checked === true)}
                            />
                            <Label htmlFor="join-lines" className="text-sm font-medium cursor-pointer">
                                压缩文本行 (Join Lines)
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">将多行文本合并为一行，去除换行符和多余空格</p>

                        {/* 压缩效果预览 - 固定高度避免位移 */}
                        <div className="rounded-md bg-muted/50 p-2 text-xs h-[58px]">
                            {joinLines && text.trim() ? (
                                <>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-muted-foreground">压缩效果:</span>
                                        {compressionRatio !== '0' && (
                                            <Badge variant="outline" className="text-xs">
                                                减少 {compressionRatio}%
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {originalLines} 行 → 1 行, {originalLength} → {processedLength} 字符
                                    </div>
                                </>
                            ) : (
                                <div className="text-muted-foreground/50 flex items-center justify-center h-full">
                                    {joinLines ? '输入文本后查看压缩效果' : '启用压缩可查看效果预览'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 生成按钮 */}
                    <Button onClick={handleGenerate} disabled={!processedText.trim() || isLoading} className="w-full">
                        {isLoading ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <i className="i-lucide-sparkles mr-2" />
                                生成二维码
                            </>
                        )}
                    </Button>

                    {/* 提示信息 */}
                    {estimatedQRCount > 10 && (
                        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-xs text-yellow-800 dark:text-yellow-200">
                            <i className="i-lucide-alert-triangle inline-block mr-1" />
                            预估生成 {estimatedQRCount} 个二维码，建议缩短文本长度
                        </div>
                    )}
                </div>
            </Card>

            {/* 右侧：结果区域 */}
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <i className="i-lucide-images text-xl" />
                                生成结果
                            </h3>
                            {qrFiles.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    共 {qrFiles.length} 个二维码
                                    {qrFiles.length > 1 && (
                                        <span className="text-orange-600 dark:text-orange-400 ml-2">请按顺序扫描</span>
                                    )}
                                </p>
                            )}
                        </div>
                        {qrFiles.length > 0 && (
                            <Button variant="outline" size="sm" onClick={() => downloadAllQRCodes(qrFiles)}>
                                <i className="i-lucide-download mr-2" />
                                全部下载
                            </Button>
                        )}
                    </div>

                    {qrFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                            <i className="i-lucide-image-off text-6xl mb-4 opacity-20" />
                            <p>二维码将在这里显示</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[500px]">
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 pr-4">
                                {qrFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="group relative border rounded-lg p-1.5 hover:shadow-md transition-all hover:border-primary/50"
                                    >
                                        <div className="aspect-square bg-white rounded overflow-hidden mb-1.5">
                                            <img
                                                src={file.dataUrl}
                                                alt={file.name}
                                                className="w-full h-full object-contain cursor-pointer"
                                                onClick={() => handlePreview(index)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between gap-1">
                                            <p className="text-xs text-muted-foreground truncate flex-1">{file.name}</p>
                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0"
                                                    onClick={() => handlePreview(index)}
                                                >
                                                    <i className="i-lucide-eye text-xs" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0"
                                                    onClick={() => downloadQRCode(file.dataUrl, file.name)}
                                                >
                                                    <i className="i-lucide-download text-xs" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </Card>
        </div>
    );
}

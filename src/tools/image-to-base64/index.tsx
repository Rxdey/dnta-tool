import imageCompression from 'browser-image-compression';
import { type DragEvent, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

interface ImageSize {
    width: number;
    height: number;
}

const AppTool = () => {
    const [base64, setBase64] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [quality, setQuality] = useState(80);
    const [format, setFormat] = useState('original');
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [scale, setScale] = useState(100);
    const [originalSize, setOriginalSize] = useState<ImageSize | null>(null);
    const [originalFileSize, setOriginalFileSize] = useState<string | null>(null);
    const [convertedFileSize, setConvertedFileSize] = useState<string | null>(null);

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl(null);
            setOriginalSize(null);
            setOriginalFileSize(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreviewUrl(objectUrl);

        const img = new Image();
        img.onload = () => {
            setOriginalSize({ width: img.width, height: img.height });
        };
        img.src = objectUrl;

        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    useEffect(() => {
        const handlePaste = (e: Event) => {
            const clipboardEvent = e as globalThis.ClipboardEvent;
            const items = clipboardEvent.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const extension = file.type.split('/')[1] || 'png';
                        const pastedFile = new File([file], `pasted-image-${timestamp}.${extension}`, {
                            type: file.type
                        });
                        
                        setImageFile(pastedFile);
                        setFileName(pastedFile.name);
                        setOriginalFileSize(formatBytes(pastedFile.size));
                        setBase64('');
                        setConvertedFileSize(null);
                    }
                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            setImageFile(file);
            setFileName(file.name);
            setOriginalFileSize(formatBytes(file.size));
            setBase64('');
            setConvertedFileSize(null);
        }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleFileChange(e.dataTransfer.files);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleConvert = async () => {
        if (!imageFile) return;

        setIsLoading(true);
        try {
            const options = {
                maxSizeMB: 5,
                initialQuality: quality / 100,
                fileType: format === 'original' ? imageFile.type : `image/${format}`,
                useWebWorker: true,
                maxWidthOrHeight: originalSize
                    ? Math.max(originalSize.width, originalSize.height) * (scale / 100)
                    : undefined,
            };

            const compressedFile = await imageCompression(imageFile, options);
            setConvertedFileSize(formatBytes(compressedFile.size));

            const reader = new FileReader();
            reader.onloadend = () => {
                setBase64(reader.result as string);
                setIsLoading(false);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('图片转换过程中发生错误:', error);
            setIsLoading(false);
        }
    };

    const getNewDimensions = (): string => {
        if (!originalSize) return '';
        const newWidth = Math.round(originalSize.width * (scale / 100));
        const newHeight = Math.round(originalSize.height * (scale / 100));
        return `${newWidth} x ${newHeight}`;
    };

    const handleClear = () => {
        setBase64('');
        setImageFile(null);
        setQuality(80);
        setFormat('original');
        setIsLoading(false);
        setFileName('');
        setPreviewUrl(null);
        setScale(100);
        setOriginalSize(null);
        setOriginalFileSize(null);
        setConvertedFileSize(null);
    };

    return (
        <div className="container mx-auto p-8 bg-background rounded-2xl">
            <h1 className="text-2xl font-bold mb-4">图片转 Base64 工具</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>图片处理</CardTitle>
                        <CardDescription>上传或拖拽图片，调整参数后进行转换。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 h-full flex flex-col">
                        <div className="space-y-2">
                            <Label htmlFor="picture">图片</Label>
                            <div
                                className="relative border-2 border-dashed border-gray-300 rounded-md p-6 text-center h-64 flex flex-col justify-center items-center"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-h-full max-w-full object-contain rounded-md"
                                    />
                                ) : (
                                    <>
                                        <p className="mb-2">{fileName || '拖拽图片到这里，或'}</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => document.getElementById('picture')?.click()}
                                        >
                                            选择文件
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            💡 提示：也可以直接按 Ctrl+V 粘贴剪切板中的图片
                                        </p>
                                    </>
                                )}
                                <Input
                                    id="picture"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e.target.files)}
                                    onClick={(e) => {
                                        (e.target as HTMLInputElement).value = '';
                                    }}
                                    accept="image/*"
                                />
                            </div>
                            <div className="text-sm text-muted-foreground text-center mt-2">
                                {originalSize && originalFileSize ? (
                                    <span>
                                        原始尺寸: {originalSize?.width} x {originalSize?.height} | 大小:{' '}
                                        {originalFileSize}
                                    </span>
                                ) : (
                                    <span>-</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scale">
                                尺寸调整: {scale}% {originalSize && `(${getNewDimensions()})`}
                            </Label>
                            <Slider
                                id="scale"
                                defaultValue={[scale]}
                                min={10}
                                max={200}
                                step={1}
                                onValueChange={(value) => setScale(value[0])}
                                disabled={!imageFile}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quality">压缩质量: {quality}%</Label>
                            <Slider
                                id="quality"
                                defaultValue={[quality]}
                                max={100}
                                step={1}
                                onValueChange={(value) => setQuality(value[0])}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="format">输出格式</Label>
                            <Select onValueChange={setFormat} defaultValue={format}>
                                <SelectTrigger id="format">
                                    <SelectValue placeholder="保持原始格式" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="original">保持原始格式</SelectItem>
                                    <SelectItem value="jpeg">JPEG</SelectItem>
                                    <SelectItem value="png">PNG</SelectItem>
                                    <SelectItem value="webp">WEBP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex space-x-2 mt-auto">
                            <Button onClick={handleConvert} disabled={!imageFile || isLoading}>
                                {isLoading ? '转换中...' : '转换'}
                            </Button>
                            {imageFile && (
                                <Button onClick={handleClear} variant="destructive">
                                    清除
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Base64 结果</CardTitle>
                        <CardDescription>
                            {convertedFileSize ? `转换后大小: ${convertedFileSize}` : '转换后的 Base64 编码。'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 h-full flex flex-col">
                        <Textarea
                            value={base64}
                            readOnly
                            className="min-h-[200px] max-h-96 flex-1 font-mono text-sm w-full"
                            placeholder="这里将显示转换后的 Base64 编码..."
                        />
                        <div className="mt-2">
                            <Button onClick={() => navigator.clipboard.writeText(base64)} disabled={!base64}>
                                复制
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AppTool;

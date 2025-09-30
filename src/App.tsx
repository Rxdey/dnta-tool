import imageCompression from 'browser-image-compression';
import { type DragEvent, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

/**
 * 将字节数转换为人类可读的文件大小格式
 * @param bytes - 字节数
 * @param decimals - 小数点后保留位数，默认为2
 * @returns 格式化后的文件大小字符串，如 "1.5 MB"
 */
const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 图片尺寸信息类型
 */
interface ImageSize {
    width: number;
    height: number;
}

/**
 * 主应用组件 - 图片转 Base64 工具
 * 支持文件上传、拖拽、剪切板粘贴等多种方式导入图片
 */
const App = () => {
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

    /**
     * 监听图片文件变化，生成预览URL并获取图片尺寸信息
     */
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

        // 组件卸载时释放内存
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    /**
     * 添加全局粘贴事件监听器，支持从剪切板粘贴图片
     */
    useEffect(() => {
        const handlePaste = (e: Event) => {
            const clipboardEvent = e as globalThis.ClipboardEvent;
            const items = clipboardEvent.clipboardData?.items;
            if (!items) return;

            // 查找剪切板中的图片文件
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        // 为粘贴的图片生成文件名
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const extension = file.type.split('/')[1] || 'png';
                        const pastedFile = new File([file], `pasted-image-${timestamp}.${extension}`, {
                            type: file.type
                        });
                        
                        setImageFile(pastedFile);
                        setFileName(pastedFile.name);
                        setOriginalFileSize(formatBytes(pastedFile.size));
                        // 重置之前的转换结果
                        setBase64('');
                        setConvertedFileSize(null);
                    }
                    break;
                }
            }
        };

        // 添加全局粘贴事件监听
        document.addEventListener('paste', handlePaste);
        
        // 清理事件监听器
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    /**
     * 处理文件选择变化事件
     * @param files - 选择的文件列表
     */
    const handleFileChange = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            setImageFile(file);
            setFileName(file.name);
            setOriginalFileSize(formatBytes(file.size));
            // 重置之前的转换结果
            setBase64('');
            setConvertedFileSize(null);
        }
    };

    /**
     * 处理文件拖拽放下事件
     * @param e - 拖拽事件对象
     */
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleFileChange(e.dataTransfer.files);
    };

    /**
     * 处理文件拖拽悬停事件，阻止默认行为
     * @param e - 拖拽事件对象
     */
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    /**
     * 处理图片转换为 Base64 的异步操作
     * 包括图片压缩、格式转换、尺寸调整等功能
     */
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

    /**
     * 根据缩放比例计算新的图片尺寸
     * @returns 格式化的尺寸字符串，如 "800 x 600"
     */
    const getNewDimensions = (): string => {
        if (!originalSize) return '';
        const newWidth = Math.round(originalSize.width * (scale / 100));
        const newHeight = Math.round(originalSize.height * (scale / 100));
        return `${newWidth} x ${newHeight}`;
    };

    /**
     * 清除所有状态，重置应用到初始状态
     */
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
        <div className="container mx-auto p-4">
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

export default App;

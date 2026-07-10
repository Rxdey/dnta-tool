import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  loadPdfDocument,
  renderAllPages,
  type RenderedPage,
} from './utils/render';
import {
  composeLongImage,
  downloadBlob,
  downloadPagesAsZip,
  downloadPagesIndividually,
  type ImageFormat,
} from './utils/export';

/** 导出格式选项 */
const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: 'png', label: 'PNG（无损）' },
  { value: 'jpeg', label: 'JPEG（体积小）' },
  { value: 'webp', label: 'WebP（现代）' },
];

/** 清晰度（渲染倍率）选项 */
const SCALE_OPTIONS = [
  { value: 1, label: '1x 普通' },
  { value: 1.5, label: '1.5x' },
  { value: 2, label: '2x 清晰' },
  { value: 3, label: '3x 高清' },
];

const PdfToImage = () => {
  /** 选中的 PDF 文件 */
  const [file, setFile] = useState<File | null>(null);
  /** 已渲染页面（含 canvas，用于导出） */
  const [pages, setPages] = useState<RenderedPage[]>([]);
  /** 预览图（dataURL，用于展示，避免 React 直渲 canvas 节点） */
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  /** 转换中 */
  const [isConverting, setIsConverting] = useState(false);
  /** 导出中 */
  const [isExporting, setIsExporting] = useState(false);
  /** 转换进度（0~100） */
  const [progress, setProgress] = useState(0);
  /** 导出格式 */
  const [format, setFormat] = useState<ImageFormat>('png');
  /** 渲染倍率 */
  const [scale, setScale] = useState<number>(2);
  /** 图片质量（jpeg/webp 生效） */
  const [quality, setQuality] = useState<number>(0.92);
  /** 长图页间隙（像素） */
  const [gap, setGap] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  /** 当前 PDF 基础名（去扩展名），用于导出文件名 */
  const baseName = file ? file.name.replace(/\.pdf$/i, '') : 'document';

  /** 是否已成功转换出页面 */
  const hasResult = pages.length > 0;

  /** 核心：加载并渲染全部页面 */
  const convert = useCallback(async () => {
    if (!file) return;
    setIsConverting(true);
    setProgress(0);
    setPages([]);
    setPreviewUrls([]);
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await loadPdfDocument(buffer);
      setProgress(5);
      const rendered = await renderAllPages(pdf, scale);
      // 生成预览图（dataURL）
      const urls = rendered.map((p) => p.canvas.toDataURL('image/png'));
      setPages(rendered);
      setPreviewUrls(urls);
      setProgress(100);
      // pdf.js 的 PDFDocumentProxy 在运行时存在 destroy()，但类型声明缺失，这里做安全断言释放 worker 资源
      await (pdf as unknown as { destroy: () => Promise<void> }).destroy();
      toast.success(`转换完成，共 ${rendered.length} 页`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF 解析失败';
      toast.error(`转换失败：${msg}`);
    } finally {
      setIsConverting(false);
    }
  }, [file, scale]);

  /** 选择文件后自动转换 */
  useEffect(() => {
    if (file) {
      void convert();
    }
    // 仅在文件变化时触发，scale 变化由「重新转换」按钮处理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  /** 处理用户选择的文件（校验类型） */
  const handleFile = useCallback((f: File | undefined | null) => {
    if (!f) return;
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    if (!isPdf) {
      toast.error('请选择 PDF 文件');
      return;
    }
    setFile(f);
  }, []);

  /** 拖拽放置 */
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile],
  );

  /** 导出：逐页下载 */
  const handleDownloadEach = useCallback(async () => {
    if (!hasResult) return;
    setIsExporting(true);
    try {
      await downloadPagesIndividually(pages, format, baseName, quality);
      toast.success('已逐页下载');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '下载失败';
      toast.error(`逐页下载失败：${msg}`);
    } finally {
      setIsExporting(false);
    }
  }, [hasResult, pages, format, baseName, quality]);

  /** 导出：打包 zip */
  const handleDownloadZip = useCallback(async () => {
    if (!hasResult) return;
    setIsExporting(true);
    try {
      await downloadPagesAsZip(pages, format, baseName, quality);
      toast.success('已打包为 ZIP 下载');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '打包失败';
      toast.error(`打包失败：${msg}`);
    } finally {
      setIsExporting(false);
    }
  }, [hasResult, pages, format, baseName, quality]);

  /** 导出：合成长图 */
  const handleDownloadLong = useCallback(async () => {
    if (!hasResult) return;
    setIsExporting(true);
    try {
      // jpeg 下透明间隙会变黑，统一给白底
      const bg = format === 'png' || format === 'webp' ? '#ffffff' : '#ffffff';
      const blob = await composeLongImage(pages, gap, bg, format, quality);
      const ext = format === 'jpeg' ? 'jpg' : format;
      downloadBlob(blob, `${baseName}-long.${ext}`);
      toast.success('长图已下载');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成长图失败';
      toast.error(`生成长图失败：${msg}`);
    } finally {
      setIsExporting(false);
    }
  }, [hasResult, pages, gap, format, baseName, quality]);

  /** 清空 */
  const handleClear = useCallback(() => {
    setFile(null);
    setPages([]);
    setPreviewUrls([]);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 gap-3 min-w-0">
      {/* 标题 */}
      <div className="flex-shrink-0">
        <h1 className="text-lg font-semibold text-foreground">PDF 转图片</h1>
        <p className="text-sm text-muted-foreground">
          在浏览器本地将 PDF 逐页转为图片，支持单页下载、ZIP 打包与合成长图，文件不会上传。
        </p>
      </div>

      {/* 控制卡片 */}
      <Card className="flex-shrink-0">
        <CardContent className="pt-4 flex flex-col gap-3">
          {/* 文件选择 / 拖拽区 */}
          <div
            ref={dropRef}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 px-4 cursor-pointer hover:border-primary/60 hover:bg-accent/40 transition-colors"
          >
            <i className="i-lucide-upload text-2xl text-muted-foreground"></i>
            <p className="text-sm text-foreground">
              {file ? (
                <span className="inline-flex items-center gap-2">
                  <i className="i-lucide-file-text"></i>
                  {file.name}
                  <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                </span>
              ) : (
                '点击或拖拽 PDF 文件到此处'
              )}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {/* 选项行 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">导出格式</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ImageFormat)}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">清晰度</Label>
              <Select value={String(scale)} onValueChange={(v) => setScale(Number(v))}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCALE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">长图间隙(px)</Label>
              <Input
                type="number"
                min={0}
                max={200}
                value={gap}
                onChange={(e) => setGap(Math.max(0, Number(e.target.value) || 0))}
                className="h-8"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">
                质量 {format !== 'png' ? `${Math.round(quality * 100)}%` : '—'}
              </Label>
              <Input
                type="number"
                min={10}
                max={100}
                step={5}
                disabled={format === 'png'}
                value={Math.round(quality * 100)}
                onChange={(e) =>
                  setQuality(Math.min(1, Math.max(0.1, Number(e.target.value) / 100 || 0.92)))
                }
                className="h-8"
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="default"
              size="sm"
              onClick={convert}
              disabled={!file || isConverting}
            >
              <i className={isConverting ? 'i-lucide-loader-circle animate-spin' : 'i-lucide-refresh-cw'}></i>
              {isConverting ? `转换中 ${progress}%` : hasResult ? '重新转换' : '开始转换'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!file && !hasResult}
            >
              <i className="i-lucide-trash-2"></i>
              清空
            </Button>
            {hasResult && (
              <Badge variant="secondary" className="ml-auto">
                共 {pages.length} 页
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 预览区（可滚动） */}
      <div className="flex-1 min-h-0 flex flex-col border border-border rounded-lg bg-background overflow-hidden min-w-0">
        {hasResult ? (
          <>
            {/* 预览工具条 */}
            <div className="flex items-center justify-between flex-shrink-0 px-3 py-2 border-b border-border">
              <span className="text-xs font-semibold text-foreground">预览</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadEach}
                  disabled={isExporting}
                >
                  <i className="i-lucide-download"></i>
                  逐页下载
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadZip}
                  disabled={isExporting}
                >
                  <i className="i-lucide-file-archive"></i>
                  打包 ZIP
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownloadLong}
                  disabled={isExporting}
                >
                  <i className="i-lucide-rows-3"></i>
                  合成长图
                </Button>
              </div>
            </div>
            {/* 缩略图网格 */}
            <div className="flex-1 min-h-0 overflow-auto p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {previewUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col rounded-md border border-border overflow-hidden bg-muted/30"
                  >
                    <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground border-b border-border">
                      <span>第 {idx + 1} 页</span>
                      <span>{pages[idx]?.width}×{pages[idx]?.height}</span>
                    </div>
                    <img
                      src={url}
                      alt={`第 ${idx + 1} 页`}
                      className="w-full h-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            {file ? '正在转换…' : '请先选择 PDF 文件'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfToImage;

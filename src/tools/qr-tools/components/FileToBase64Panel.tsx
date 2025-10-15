import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { fileToBase64, compressImageFile, formatFileSize } from '../utils/fileUtils';

export function FileToBase64Panel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [base64Result, setBase64Result] = useState('');

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setBase64Result(''); // 清空之前的结果
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.error('请先选择文件');
      return;
    }

    setIsLoading(true);
    try {
      let fileToConvert = selectedFile;
      
      // 如果是图片且启用压缩
      if (selectedFile.type.startsWith('image/') && compressionEnabled) {
        toast.loading('正在压缩图片...', { id: 'compress' });
        fileToConvert = await compressImageFile(selectedFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
        toast.success('图片压缩完成', { id: 'compress' });
      }

      toast.loading('正在转换...', { id: 'convert' });
      const base64 = await fileToBase64(fileToConvert);
      setBase64Result(base64);
      
      toast.success('转换成功', {
        id: 'convert',
        description: `大小: ${formatFileSize(base64.length * 0.75)}`
      });
    } catch (error) {
      console.error('转换失败:', error);
      toast.error('转换失败', {
        id: 'convert',
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = async () => {
    if (!base64Result) return;
    try {
      await navigator.clipboard.writeText(base64Result);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return 'i-lucide-image';
    } else if (file.type.startsWith('text/')) {
      return 'i-lucide-file-text';
    } else if (file.type.startsWith('video/')) {
      return 'i-lucide-video';
    } else if (file.type.startsWith('audio/')) {
      return 'i-lucide-music';
    } else {
      return 'i-lucide-file';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* 左侧：上传区域 */}
      <Card
        className="p-6 min-h-[600px] flex flex-col cursor-pointer transition-colors hover:border-primary/50"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !selectedFile && fileInputRef.current?.click();
          }
        }}
      >
        <div className="flex flex-col flex-1">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <i className="i-lucide-file-input text-xl" />
              文件转 Base64
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              点击、拖拽或粘贴文件 (最大 5MB)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {/* 已选择的文件或上传提示 */}
          {!selectedFile ? (
            <div
              className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25'
              }`}
            >
              <i className="i-lucide-folder-open text-5xl text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                拖拽、点击或粘贴文件
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <i className="i-lucide-upload mr-2" />
                选择文件
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center space-x-3">
                  <i className={`${getFileIcon(selectedFile)} text-3xl text-primary`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setBase64Result('');
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <i className="i-lucide-x" />
                  </Button>
                </div>
              </div>

              {/* 压缩选项 (仅图片) */}
              {selectedFile.type.startsWith('image/') && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compression"
                      checked={compressionEnabled}
                      onCheckedChange={(checked) => setCompressionEnabled(checked === true)}
                    />
                    <Label htmlFor="compression" className="text-sm font-medium cursor-pointer">
                      启用图片压缩
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    压缩图片可减小 Base64 大小，推荐开启
                  </p>
                </div>
              )}

              {/* 转换按钮 */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConvert();
                }}
                disabled={isLoading}
                className="w-full mt-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    转换中...
                  </>
                ) : (
                  <>
                    <i className="i-lucide-arrow-right mr-2" />
                    转换为 Base64
                  </>
                )}
              </Button>

              {/* 提示信息 */}
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg mt-auto">
                <p>• 支持所有类型文件转换</p>
                <p>• 图片文件建议开启压缩</p>
                <p>• 文件大小建议不超过 5MB</p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 右侧：结果区域 */}
      <Card className="p-6 min-h-[600px] flex flex-col">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="i-lucide-code text-xl" />
                Base64 结果
              </h3>
              {base64Result && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatFileSize(base64Result.length * 0.75)}
                </p>
              )}
            </div>
            {base64Result && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyResult}
              >
                <i className="i-lucide-copy mr-2" />
                复制
              </Button>
            )}
          </div>

          {!base64Result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <i className="i-lucide-file-code text-6xl mb-4 opacity-20" />
              <p>Base64 结果将在这里显示</p>
            </div>
          ) : (
            <Textarea
              value={base64Result}
              readOnly
              className="resize-none flex-1 font-mono text-xs break-all"
            />
          )}
        </div>
      </Card>
    </div>
  );
}

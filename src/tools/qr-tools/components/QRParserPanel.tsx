import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { parseQRFromImage } from '../utils/qrcode';
import type { ParsedImage } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  image: ParsedImage;
  index: number;
  originalIndex: number;
  onRemove: (id: string) => void;
}

function SortableItem({ image, index, originalIndex, onRemove }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative border rounded-lg p-2 hover:shadow-sm transition-shadow bg-card"
    >
      <div className="flex items-center space-x-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move p-1 hover:bg-muted rounded"
        >
          <i className="i-lucide-grip-vertical text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center">
          <Badge variant="outline" className="text-xs">
            {index + 1}
          </Badge>
          {originalIndex !== index && (
            <Badge variant="secondary" className="text-[10px] mt-0.5">
              #{originalIndex + 1}
            </Badge>
          )}
        </div>
        <img
          src={image.preview}
          alt={image.file.name}
          className="w-10 h-10 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate">
            {image.file.name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(image.id)}
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
        >
          <i className="i-lucide-x text-sm" />
        </Button>
      </div>
    </div>
  );
}

export function QRParserPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsedImages, setParsedImages] = useState<ParsedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length > 0) {
        const baseIndex = parsedImages.length;
        const newImages: ParsedImage[] = imageFiles.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          file,
          preview: URL.createObjectURL(file),
          index: baseIndex + index,
          originalIndex: baseIndex + index,
        }));
        setParsedImages([...parsedImages, ...newImages]);
        toast.success(`已添加 ${newImages.length} 张图片`);
      }
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

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        const baseIndex = parsedImages.length;
        const newImages: ParsedImage[] = files.map((file, index) => ({
          id: `${Date.now()}-${index}`,
          file,
          preview: URL.createObjectURL(file),
          index: baseIndex + index,
          originalIndex: baseIndex + index,
        }));
        setParsedImages([...parsedImages, ...newImages]);
        toast.success(`已添加 ${newImages.length} 张图片`);
      }
    }
  };

  const removeImage = (id: string) => {
    const filtered = parsedImages.filter(img => {
      if (img.id === id) {
        URL.revokeObjectURL(img.preview);
        return false;
      }
      return true;
    });
    const reindexed = filtered.map((img, index) => ({ ...img, index }));
    setParsedImages(reindexed);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setParsedImages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, index }));
      });
    }
  };

  const parseAll = async () => {
    if (parsedImages.length === 0) {
      toast.error('请先添加要解析的图片');
      return;
    }

    setIsLoading(true);
    try {
      const results: string[] = [];
      
      for (let i = 0; i < parsedImages.length; i++) {
        const image = parsedImages[i];
        toast.loading(`正在解析第 ${i + 1}/${parsedImages.length} 张图片...`, {
          id: 'parsing'
        });
        
        try {
          const text = await parseQRFromImage(image.file);
          results.push(text);
        } catch (error) {
          console.error(`解析 ${image.file.name} 失败:`, error);
          toast.error(`解析 ${image.file.name} 失败`, { id: 'parsing' });
          throw error;
        }
      }

      const combinedText = results.join('');
      setParseResult(combinedText);

      toast.success(`成功解析 ${parsedImages.length} 张二维码`, {
        id: 'parsing',
        description: `共获取 ${combinedText.length} 个字符`
      });
    } catch (error) {
      console.error('解析失败:', error);
      toast.error('解析失败', {
        id: 'parsing',
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    parsedImages.forEach(img => {
      URL.revokeObjectURL(img.preview);
    });
    setParsedImages([]);
    setParseResult('');
    toast.success('已清空所有图片');
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(parseResult);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  return (
    <div className="flex gap-4 size-full">
      {/* 左侧：上传和图片列表 */}
      <Card 
        className="p-6 flex-1 flex flex-col min-h-0"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <i className="i-lucide-scan text-xl" />
              二维码解析
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              拖拽、粘贴图片到面板或点击选择文件
            </p>
          </div>

          {parsedImages.length === 0 ? (
            /* 空状态 - 大面积上传区域 */
            <div 
              className={`flex-1 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <div className="text-center space-y-4 p-4">
                <i className="i-lucide-camera text-6xl text-muted-foreground/50" />
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    拖拽、粘贴或选择图片
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="i-lucide-upload mr-2" />
                    选择文件
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 支持多张图片按顺序解析</p>
                  <p>• 可拖动调整解析顺序</p>
                </div>
              </div>
            </div>
          ) : (
            /* 有图片时的列表显示 */
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{parsedImages.length} 张图片</Badge>
                  <Badge variant="outline">拖动排序</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="i-lucide-plus mr-1" />
                    添加
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-destructive hover:text-destructive"
                  >
                    <i className="i-lucide-trash-2" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0 overflow-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={parsedImages.map(img => img.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 pr-4">
                      {parsedImages.map((image, index) => (
                        <SortableItem
                          key={image.id}
                          image={image}
                          index={index}
                          originalIndex={image.originalIndex}
                          onRemove={removeImage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {/* 操作按钮 */}
          {parsedImages.length > 0 && (
            <Button
              onClick={parseAll}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  解析中...
                </>
              ) : (
                <>
                  <i className="i-lucide-play mr-2" />
                  开始解析
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* 右侧：解析结果 */}
      <Card className="p-6 flex-1 flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="i-lucide-file-text text-xl" />
                解析结果
              </h3>
              {parseResult && (
                <p className="text-sm text-muted-foreground mt-1">
                  共 {parseResult.length} 个字符
                </p>
              )}
            </div>
            {parseResult && (
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

          {!parseResult ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <i className="i-lucide-file-search text-6xl mb-4 opacity-20" />
              <p>解析结果将在这里显示</p>
            </div>
          ) : (
            <Textarea
              value={parseResult}
              readOnly
              className="flex-1 resize-none font-mono text-sm"
            />
          )}
        </div>
      </Card>
    </div>
  );
}

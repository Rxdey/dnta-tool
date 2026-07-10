import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// 注册 <json-viewer> 自定义元素（Chrome DevTools 网络面板 JSON 查看器复刻）
import '@_1602/json-viewer';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { fixJson, formatJson, safeParse, unescapeJson } from './utils/format';

/**
 * JSON 查看器工具
 * 左侧输入 JSON 文本，右侧以 Chrome DevTools 风格的树状结构预览；
 * 仅当 JSON 合法时才渲染预览，非法时展示内联错误。
 */
const JsonViewer = () => {
  /** 输入框文本 */
  const [input, setInput] = useState('');
  /** 解析成功后的 JSON 数据（可能为 null） */
  const [parsed, setParsed] = useState<unknown>(null);
  /** 是否已成功解析出结果（区分「空」与「合法但值为 null」） */
  const [hasResult, setHasResult] = useState(false);
  /** 解析错误信息 */
  const [error, setError] = useState<string | null>(null);
  /** 是否全屏预览 */
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Esc 退出全屏
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  /**
   * 解析文本并刷新预览状态
   * @returns 是否解析成功
   */
  const doPreview = useCallback((text: string): boolean => {
    if (!text.trim()) {
      setParsed(null);
      setHasResult(false);
      setError(null);
      return false;
    }
    const { data, error: parseError } = safeParse(text);
    if (parseError) {
      setParsed(null);
      setHasResult(false);
      setError(parseError);
      toast.error('JSON 格式有误，无法预览');
      return false;
    }
    setParsed(data);
    setHasResult(true);
    setError(null);
    return true;
  }, []);

  /** 格式化：重排为 2 空格缩进（含去前后引号处理） */
  const handleFormat = useCallback(() => {
    try {
      const out = formatJson(input);
      setInput(out);
      doPreview(out);
      toast.success('已格式化');
    } catch {
      toast.error('格式化失败：输入不是有效的 JSON');
    }
  }, [input, doPreview]);

  /** 去转义：解开转义后的 JSON 字符串 */
  const handleUnescape = useCallback(() => {
    try {
      const out = unescapeJson(input);
      setInput(out);
      doPreview(out);
      toast.success('已去转义');
    } catch {
      toast.error('去转义失败：输入为空或无法处理');
    }
  }, [input, doPreview]);

  /** 格式修复：启发式修复后再预览（best-effort，不保证一定成功） */
  const handleFix = useCallback(() => {
    const out = fixJson(input);
    setInput(out);
    const ok = doPreview(out);
    toast[ok ? 'success' : 'error'](
      ok ? '已尝试格式修复' : '已尝试修复，但结果仍不是合法的 JSON',
    );
  }, [input, doPreview]);

  /** 预览：重新解析当前输入 */
  const handlePreview = useCallback(() => {
    const ok = doPreview(input);
    if (ok) {
      toast.success('已更新预览');
    }
  }, [input, doPreview]);

  /** 复制：复制当前合法 JSON 的格式化文本 */
  const handleCopy = useCallback(async () => {
    const textToCopy = hasResult ? JSON.stringify(parsed, null, 2) : input;
    if (!textToCopy.trim()) {
      toast.error('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  }, [hasResult, parsed, input]);

  /** 清空：重置所有状态 */
  const handleClear = useCallback(() => {
    setInput('');
    setParsed(null);
    setHasResult(false);
    setError(null);
  }, []);

  return (
    <div className="flex flex-col overflow-hidden p-4 bg-background rounded-2xl h-full max-w-full">
      {/* 标题栏 */}
      <div className="flex-shrink-0 pb-2 border-b mb-2">
        <h1 className="text-lg font-bold text-foreground">JSON 查看器</h1>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden min-h-0 min-w-0">
        {/* 左面板：输入 */}
        <div className="flex flex-col overflow-hidden w-full lg:w-2/5 min-w-0 min-h-0 border border-border rounded-lg bg-background">
          {/* 工具条 */}
          <div className="flex items-center justify-between flex-shrink-0 px-3 py-1.5 border-b border-border">
            <span className="text-xs font-semibold text-foreground">JSON 输入</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFormat}
                disabled={!input.trim()}
                className="h-6 px-2 text-xs"
              >
                <i className="i-lucide-indent mr-1"></i>
                格式化
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnescape}
                disabled={!input.trim()}
                className="h-6 px-2 text-xs"
              >
                <i className="i-lucide-eraser mr-1"></i>
                去转义
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFix}
                disabled={!input.trim()}
                className="h-6 px-2 text-xs"
              >
                <i className="i-lucide-wrench mr-1"></i>
                格式修复
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!input.trim()}
                className="h-6 px-2 text-xs"
              >
                <i className="i-lucide-eye mr-1"></i>
                预览
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                disabled={!input}
                className="h-6 w-6"
              >
                <i className="i-lucide-x text-xs"></i>
              </Button>
            </div>
          </div>

          {/* 输入区 */}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 font-mono text-xs min-h-0 resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="在此粘贴或输入 JSON 数据..."
          />
        </div>

        {/* 右面板：预览 */}
        <div className="flex flex-col overflow-hidden flex-1 min-h-0 min-w-0 border border-border rounded-lg bg-background">
          {/* 工具条 */}
          <div className="flex items-center justify-between flex-shrink-0 px-3 py-1.5 border-b border-border">
            <span className="text-xs font-semibold text-foreground">JSON 预览</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!input.trim()}
                className="h-6 px-2 text-xs"
              >
                <i className="i-lucide-copy mr-1"></i>
                复制
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                disabled={!hasResult}
                className="h-6 px-2 text-xs"
              >
                <i className="i-lucide-maximize mr-1"></i>
                全屏
              </Button>
            </div>
          </div>

          {/* 结果区 */}
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
            {error && input.trim() ? (
              <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 rounded-md p-2.5 m-2">
                <i className="i-lucide-alert-circle mt-0.5"></i>
                <div>
                  <p className="font-medium">JSON 解析错误</p>
                  <p className="text-destructive/80 mt-0.5 break-all">{error}</p>
                </div>
              </div>
            ) : hasResult ? (
              // @_1602/json-viewer 的 value 属性要求是 JSON 字符串（内部会 JSON.parse），
              // 因此把解析后的对象重新 stringify 再传入
              <json-viewer value={JSON.stringify(parsed)}></json-viewer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <i className="i-lucide-braces text-2xl mb-1.5"></i>
                <p className="text-xs">在左侧输入合法的 JSON 数据即可查看树状预览</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 全屏预览浮层：覆盖整个视口，长内容在内部滚动 */}
      {isFullscreen && hasResult && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background">
          {/* 浮层工具条 */}
          <div className="flex items-center justify-between flex-shrink-0 px-4 py-2 border-b border-border">
            <span className="text-sm font-semibold text-foreground">JSON 预览（全屏）</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs"
              >
                <i className="i-lucide-copy mr-1"></i>
                复制
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="h-7 px-2 text-xs"
              >
                <i className="i-lucide-minimize mr-1"></i>
                退出全屏
              </Button>
            </div>
          </div>
          {/* 浮层预览区 */}
          <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
            <json-viewer value={JSON.stringify(parsed)}></json-viewer>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonViewer;

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  buildUrl,
  jsonToParams,
  paramsToJson,
  parseUrl,
  type ParamEntry,
  type UrlShell,
} from './utils/params';

/** 表单行：在参数基础上加稳定 id，避免增删行时输入框失焦 */
interface ParamRow extends ParamEntry {
  /** 行唯一标识 */
  id: number;
}

/** 演示用示例 URL */
const SAMPLE_URL = 'https://example.com/search?q=hello%20world&page=1&tag=news&tag=tech#top';

/** URL 参数编辑器：输入 URL → 参数表单 / JSON 双视图编辑 → 生成新 URL */
const UrlParamsEditor = () => {
  /** 顶部 URL 输入框内容 */
  const [urlInput, setUrlInput] = useState('');
  /** URL 外壳（base/hash/?前缀） */
  const [shell, setShell] = useState<UrlShell>({ base: '', hash: '', hasQueryMark: false });
  /** 参数表单行（数据源之一，含稳定 id） */
  const [rows, setRows] = useState<ParamRow[]>([]);
  /** JSON 编辑器文本 */
  const [jsonText, setJsonText] = useState('{}');
  /** JSON 解析错误（不影响已生效的 rows） */
  const [jsonError, setJsonError] = useState<string | null>(null);
  /** 是否暗色主题（跟随项目 <html class="dark">） */
  const [isDark, setIsDark] = useState<boolean>(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  /** 自增行 id 生成器 */
  const nextId = useRef(1);

  // 监听 <html> class，使编辑器主题跟随项目亮/暗切换
  useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(el.classList.contains('dark')));
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  /** 纯参数列表（去掉 UI 用的 id），供转换函数使用 */
  const params = useMemo<ParamEntry[]>(
    () => rows.map(({ key, value }) => ({ key, value })),
    [rows],
  );

  /** 实时生成的新 URL */
  const newUrl = useMemo(() => buildUrl(shell, params), [shell, params]);

  /** JSON 编辑器扩展：语法高亮 + 出错行标红 */
  const extensions = useMemo(() => [json(), linter(jsonParseLinter())], []);

  /**
   * 解析 URL 文本并把结果写入全部视图
   * @param text 用户输入的 URL
   */
  const applyUrl = useCallback((text: string) => {
    const parsed = parseUrl(text);
    setShell({ base: parsed.base, hash: parsed.hash, hasQueryMark: parsed.hasQueryMark });
    setRows(parsed.params.map((p) => ({ ...p, id: nextId.current++ })));
    setJsonText(paramsToJson(parsed.params));
    setJsonError(null);
  }, []);

  /** 顶部 URL 输入变化：实时解析 */
  const handleUrlChange = useCallback(
    (text: string) => {
      setUrlInput(text);
      applyUrl(text);
    },
    [applyUrl],
  );

  /** 由表单行同步到 JSON 视图（表单编辑后调用） */
  const syncRowsToJson = useCallback((nextRows: ParamRow[]) => {
    setRows(nextRows);
    setJsonText(paramsToJson(nextRows.map(({ key, value }) => ({ key, value }))));
    setJsonError(null);
  }, []);

  /** 编辑某一行的字段 */
  const handleParamChange = useCallback(
    (id: number, field: keyof ParamEntry, value: string) => {
      syncRowsToJson(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    },
    [rows, syncRowsToJson],
  );

  /** 新增一行空参数 */
  const handleAdd = useCallback(() => {
    syncRowsToJson([...rows, { id: nextId.current++, key: '', value: '' }]);
  }, [rows, syncRowsToJson]);

  /** 删除指定行 */
  const handleRemove = useCallback(
    (id: number) => syncRowsToJson(rows.filter((row) => row.id !== id)),
    [rows, syncRowsToJson],
  );

  /** JSON 编辑：解析成功则同步到表单，失败仅内联报错、保留上次有效结果 */
  const handleJsonChange = useCallback((text: string) => {
    setJsonText(text);
    try {
      const parsed = jsonToParams(text);
      setRows(parsed.map((p) => ({ ...p, id: nextId.current++ })));
      setJsonError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : '无效的 JSON';
      console.error('[url-params-editor] JSON 解析失败：', message);
      setJsonError(message);
    }
  }, []);

  /** 复制生成的新 URL */
  const handleCopy = useCallback(async () => {
    if (!newUrl.trim()) {
      toast.error('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(newUrl);
      toast.success('已复制新 URL');
    } catch (e) {
      console.error('[url-params-editor] 复制失败：', e);
      toast.error('复制失败');
    }
  }, [newUrl]);

  /** 在浏览器打开生成的新 URL（仅允许 http/https） */
  const handleOpen = useCallback(() => {
    if (!/^https?:\/\//i.test(newUrl)) {
      toast.error('新 URL 不是完整的 http(s) 地址，无法打开');
      return;
    }
    window.open(newUrl, '_blank', 'noopener,noreferrer');
  }, [newUrl]);

  /** 清空全部内容 */
  const handleClear = useCallback(() => {
    setUrlInput('');
    setShell({ base: '', hash: '', hasQueryMark: false });
    setRows([]);
    setJsonText('{}');
    setJsonError(null);
  }, []);

  /** 载入示例 URL */
  const handleSample = useCallback(() => {
    setUrlInput(SAMPLE_URL);
    applyUrl(SAMPLE_URL);
  }, [applyUrl]);

  return (
    <div className="flex flex-col overflow-hidden p-4 bg-background rounded-2xl h-full max-w-full">
      {/* 标题栏 */}
      <div className="flex-shrink-0 pb-2 border-b mb-3 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">URL 参数编辑器</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            解析 query 参数，表单与 JSON 双视图可编辑，实时生成新 URL
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={handleSample} className="h-7 px-2 text-xs">
            <i className="i-lucide-sparkles mr-1"></i>
            示例
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={!urlInput && !rows.length}
            className="h-7 w-7"
            title="清空"
          >
            <i className="i-lucide-trash-2 text-xs"></i>
          </Button>
        </div>
      </div>

      {/* 顶部：URL 输入 */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-foreground">URL / Query 输入</span>
          <span className="text-[10px] text-muted-foreground">输入后自动解析，支持完整 URL 或纯 query</span>
        </div>
        <Input
          value={urlInput}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/path?key=value&tag=a&tag=b#hash"
          className="font-mono text-xs h-9"
        />
      </div>

      {/* 中部：分栏展示（表单 / JSON） */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden min-h-0 min-w-0">
        {/* 左：参数表单 */}
        <div className="flex flex-col overflow-hidden w-full lg:w-1/2 min-w-0 min-h-0 border border-border rounded-lg bg-background">
          <div className="flex items-center justify-between flex-shrink-0 px-3 py-1.5 border-b border-border">
            <span className="text-xs font-semibold text-foreground">
              参数表单 <span className="text-muted-foreground font-normal">({rows.length})</span>
            </span>
            <Button variant="outline" size="sm" onClick={handleAdd} className="h-6 px-2 text-xs">
              <i className="i-lucide-plus mr-1"></i>
              添加参数
            </Button>
          </div>

          {/* 表头 */}
          {rows.length > 0 && (
            <div className="grid grid-cols-[1fr_1fr_28px] gap-1.5 px-3 py-1 border-b border-border bg-muted/40 text-[10px] text-muted-foreground flex-shrink-0">
              <span>参数名 (Key)</span>
              <span>参数值 (Value)</span>
              <span></span>
            </div>
          )}

          {/* 参数行列表 */}
          <div className="flex-1 min-h-0 overflow-auto p-2">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-1">
                <i className="i-lucide-list text-2xl"></i>
                <p className="text-xs">在上方输入 URL，或点「添加参数」手动创建</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {rows.map((row) => (
                  <div key={row.id} className="grid grid-cols-[1fr_1fr_28px] gap-1.5 items-center">
                    <Input
                      value={row.key}
                      onChange={(e) => handleParamChange(row.id, 'key', e.target.value)}
                      placeholder="key"
                      className="font-mono text-xs h-8"
                    />
                    <Input
                      value={row.value}
                      onChange={(e) => handleParamChange(row.id, 'value', e.target.value)}
                      placeholder="value"
                      className="font-mono text-xs h-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(row.id)}
                      className="h-8 w-7 text-muted-foreground hover:text-destructive"
                      title="删除该参数"
                    >
                      <i className="i-lucide-x text-xs"></i>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右：JSON 视图 */}
        <div className="flex flex-col overflow-hidden flex-1 min-w-0 min-h-0 border border-border rounded-lg bg-background">
          <div className="flex items-center justify-between flex-shrink-0 px-3 py-1.5 border-b border-border">
            <span className="text-xs font-semibold text-foreground">JSON 视图</span>
            <span className="text-[10px] text-muted-foreground">重复参数以数组表示，可直接编辑</span>
          </div>
          <div className="json-cm flex-1 min-h-0 overflow-hidden">
            <CodeMirror
              value={jsonText}
              onChange={handleJsonChange}
              height="100%"
              theme={isDark ? 'dark' : 'light'}
              extensions={extensions}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                highlightActiveLineGutter: true,
                autocompletion: false,
              }}
              className="h-full text-xs"
            />
          </div>
          {jsonError && (
            <div className="flex items-start gap-2 flex-shrink-0 text-destructive text-xs bg-destructive/10 rounded-md p-2 m-2">
              <i className="i-lucide-alert-circle mt-0.5"></i>
              <span className="break-all">{jsonError}</span>
            </div>
          )}
        </div>
      </div>

      {/* 底部：生成的新 URL */}
      <div className="flex-shrink-0 mt-3 pt-2 border-t">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-foreground">生成的新 URL</span>
          <span className="text-[10px] text-muted-foreground">参数已自动编码</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 font-mono text-xs bg-muted rounded-md px-3 py-2 break-all max-h-20 overflow-auto">
            {newUrl || <span className="text-muted-foreground">—</span>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!newUrl}
              className="h-8 px-2 text-xs"
            >
              <i className="i-lucide-copy mr-1"></i>
              复制
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpen}
              disabled={!/^https?:\/\//i.test(newUrl)}
              className="h-8 px-2 text-xs"
            >
              <i className="i-lucide-external-link mr-1"></i>
              打开
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlParamsEditor;

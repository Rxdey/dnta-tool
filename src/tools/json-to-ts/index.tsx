import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript.min.js';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { ConvertOptions } from './types';
import { convert, renderTypes } from './utils/convert';

/**
 * 使用 PrismJS 高亮 TypeScript 代码
 */
const highlightCode = (code: string): string => {
	return Prism.highlight(code, Prism.languages.typescript, 'typescript');
};

/**
 * 注入代码高亮面板的自定义样式
 */
if (typeof document !== 'undefined') {
	const styleId = 'code-highlight-styles';
	if (!document.getElementById(styleId)) {
		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
		.code-highlight-panel {
			background: #282c34;
			color: #abb2bf;
			padding: 0.75rem;
			margin: 0;
			font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', Menlo, Consolas, monospace;
			font-size: 0.75rem;
			line-height: 1.6;
			tab-size: 2;
			white-space: pre;
			word-wrap: normal;
			width: 100%;
		}
			.code-highlight-panel code {
				font-family: inherit;
				font-size: inherit;
				background: transparent !important;
				padding: 0 !important;
			}
			/* Override Prism token colors for better contrast */
			.code-highlight-panel .token.comment,
			.code-highlight-panel .token.block-comment,
			.code-highlight-panel .token.prolog,
			.code-highlight-panel .token.doctype,
			.code-highlight-panel .token.cdata {
				color: #5c6370;
			}
			.code-highlight-panel .token.punctuation {
				color: #abb2bf;
			}
			.code-highlight-panel .token.property,
			.code-highlight-panel .token.tag,
			.code-highlight-panel .token.boolean,
			.code-highlight-panel .token.number,
			.code-highlight-panel .token.constant,
			.code-highlight-panel .token.symbol,
			.code-highlight-panel .token.deleted {
				color: #d19a66;
			}
			.code-highlight-panel .token.selector,
			.code-highlight-panel .token.attr-name,
			.code-highlight-panel .token.string,
			.code-highlight-panel .token.char,
			.code-highlight-panel .token.builtin,
			.code-highlight-panel .token.inserted {
				color: #98c379;
			}
			.code-highlight-panel .token.operator,
			.code-highlight-panel .token.entity,
			.code-highlight-panel .token.url,
			.code-highlight-panel .language-css .token.string,
			.code-highlight-panel .style .token.string {
				color: #56b6c2;
			}
			.code-highlight-panel .token.atrule,
			.code-highlight-panel .token.attr-value,
			.code-highlight-panel .token.keyword {
				color: #c678dd;
			}
			.code-highlight-panel .token.function,
			.code-highlight-panel .token.class-name {
				color: #61afef;
			}
			.code-highlight-panel .token.regex,
			.code-highlight-panel .token.important,
			.code-highlight-panel .token.variable {
				color: #e5c07b;
			}
			/* Scrollbar styling */
			.code-highlight-panel::-webkit-scrollbar {
				width: 6px;
				height: 6px;
			}
			.code-highlight-panel::-webkit-scrollbar-track {
				background: transparent;
			}
			.code-highlight-panel::-webkit-scrollbar-thumb {
				background: #5c637066;
				border-radius: 3px;
			}
			.code-highlight-panel::-webkit-scrollbar-thumb:hover {
				background: #5c637099;
			}
		`;
		document.head.appendChild(style);
	}
}

const AppTool = () => {
	const [input, setInput] = useState('');
	const [nullAsOptional, setNullAsOptional] = useState(false);
	const [allOptional, setAllOptional] = useState(false);
	const [useInterface, setUseInterface] = useState(false);
	const [isFormatting, setIsFormatting] = useState(false);

	// 配置选项
	const options: ConvertOptions = useMemo(() => ({
		nullAsOptional,
		allOptional,
		useInterface,
	}), [nullAsOptional, allOptional, useInterface]);

	// 转换结果（防抖 300ms）
	const result = useDebounceConvert(input, options, 300);
	const rendered = useMemo(() => renderTypes(result, options), [result, options]);

	// 格式化 JSON
	const handleFormat = useCallback(() => {
		setIsFormatting(true);
		try {
			const parsed = JSON.parse(input);
			setInput(JSON.stringify(parsed, null, 2));
			toast.success('JSON 格式化成功');
		} catch (e) {
			toast.error('JSON 格式化失败：无效的 JSON 格式');
		} finally {
			setIsFormatting(false);
		}
	}, [input]);

	// 复制结果
	const handleCopy = useCallback(async () => {
		if (!rendered) {
			toast.error('没有可复制的内容');
			return;
		}
		try {
			await navigator.clipboard.writeText(rendered);
			toast.success('已复制到剪贴板');
		} catch {
			toast.error('复制失败');
		}
	}, [rendered]);

	// 清空
	const handleClear = useCallback(() => {
		setInput('');
	}, []);



		return (
			<div className="flex flex-col overflow-hidden p-4 bg-background rounded-2xl h-full max-w-full">
				<div className="flex-shrink-0 pb-2 border-b mb-2">
					<h1 className="text-lg font-bold text-foreground">JSON → TypeScript</h1>
				</div>

				<div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden min-h-0">
					{/* 左侧面板 */}
					<div className="flex flex-col overflow-hidden w-full lg:w-2/5 min-w-0 min-h-0 border border-border rounded-lg bg-background">
						{/* 工具条 */}
						<div className="flex items-center justify-between flex-shrink-0 px-3 py-1.5 border-b border-border">
							<span className="text-xs font-semibold text-foreground">JSON 输入</span>
							<div className="flex items-center gap-1">
								<Button variant="outline" size="sm" onClick={handleFormat} disabled={isFormatting} className="h-6 px-2 text-xs">
									<i className="i-lucide-align-left mr-1"></i>
									格式化
								</Button>
								<Button variant="ghost" size="icon" onClick={handleClear} className="h-6 w-6">
									<i className="i-lucide-x text-xs"></i>
								</Button>
							</div>
						</div>

						{/* 配置选项 */}
						<div className="flex-shrink-0 flex items-center gap-4 px-3 py-1 border-b border-border">
							<Label className="flex items-center gap-1.5 cursor-pointer text-xs whitespace-nowrap">
								<Checkbox checked={nullAsOptional} onCheckedChange={(v) => setNullAsOptional(v === true)} />
								null 视为可选
							</Label>
							<Label className="flex items-center gap-1.5 cursor-pointer text-xs whitespace-nowrap">
								<Checkbox checked={allOptional} onCheckedChange={(v) => setAllOptional(v === true)} />
								全部可选
							</Label>
							<Label className="flex items-center gap-1.5 cursor-pointer text-xs whitespace-nowrap">
								<Checkbox checked={useInterface} onCheckedChange={(v) => setUseInterface(v === true)} />
								interface
							</Label>
						</div>

						{/* 输入区 */}
						<Textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							className="flex-1 font-mono text-xs min-h-0 resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
							placeholder="在此粘贴 JSON 数据..."
						/>
					</div>

					{/* 右侧面板 */}
					<div className="flex flex-col overflow-hidden flex-1 min-h-0 border border-border rounded-lg bg-background">
						{/* 工具条 */}
						<div className="flex items-center justify-between flex-shrink-0 px-3 py-1.5 border-b border-border">
							<div className="flex items-center gap-2">
								<span className="text-xs font-semibold text-foreground">TypeScript 结果</span>
								{!result.error && result.types.length > 0 && (
									<span className="text-[11px] text-muted-foreground">{result.types.length} 个类型</span>
								)}
							</div>
							<Button variant="outline" size="sm" onClick={handleCopy} disabled={!rendered} className="h-6 px-2 text-xs">
								<i className="i-lucide-copy mr-1"></i>
								复制
							</Button>
						</div>

						{/* 结果区 */}
						<div className="flex-1 overflow-auto">
							{result.error && input.trim() ? (
								<div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 rounded-md p-2.5 m-2">
									<i className="i-lucide-alert-circle mt-0.5"></i>
									<div>
										<p className="font-medium">JSON 解析错误</p>
										<p className="text-destructive/80 mt-0.5">{result.error}</p>
									</div>
								</div>
							) : rendered ? (
								<div
									className="code-highlight-panel"
									dangerouslySetInnerHTML={{ __html: highlightCode(rendered) }}
								/>
							) : (
								<div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
									<i className="i-lucide-file-code text-2xl mb-1.5"></i>
									<p className="text-xs">在左侧输入 JSON 数据即可查看转换结果</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		);
};

/**
 * 防抖转换 hook
 */
function useDebounceConvert(input: string, options: ConvertOptions, delay: number) {
	const [result, setResult] = useState(() => convert(input, options));

	useEffect(() => {
		// 直接计算，不依赖外部状态
		const r = convert(input.trim(), options);
		setResult(r);
	}, [input, options, delay]);

	return result;
};

export default AppTool;

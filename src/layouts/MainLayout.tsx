import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import TabBar from '@/components/layout/TabBar';
import TabWorkspace from '@/components/layout/TabWorkspace';
import toolsData from '@/config/tools.json';
import useUiStore from '@/stores/useUiStore';

/** 分类图标映射 */
const ICON_MAP: Record<string, string> = {
    all: 'i-lucide-layout-grid',
    images: 'i-lucide-image',
    text: 'i-lucide-type',
    qr: 'i-lucide-qr-code',
    document: 'i-lucide-file-text',
};

/**
 * 侧边栏组件：品牌头 + 分类导航 + 底部统计。
 */
const Sidebar = ({ categories }: { categories: { id: string; title: string }[] }) => {
    const currentCategory = useUiStore((s) => s.category);
    const setCategory = useUiStore((s) => s.setCategory);
    const navigate = useNavigate();

    // 每个分类下的工具数量
    const countByCategory = useMemo(() => {
        const counts: Record<string, number> = { all: toolsData.length };
        toolsData.forEach((t: { category: string }) => {
            counts[t.category] = (counts[t.category] || 0) + 1;
        });
        return counts;
    }, []);

    const handleCategoryClick = (id: string) => {
        setCategory(id);
        const to = id && id !== 'all' ? `/?category=${id}` : '/';
        navigate(to, { replace: true });
    };

    return (
        <aside className="sidebar w-60 flex-shrink-0 flex flex-col bg-background border-r border-border">
            {/* 品牌 */}
            <div className="h-14 flex items-center px-4 border-b border-border">
                <Link to="/" className="flex items-center gap-2.5 group min-w-0">
                    <div className="sidebar-logo w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="i-lucide-wrench text-primary-foreground text-base"></i>
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-sm leading-tight text-foreground truncate group-hover:text-muted-foreground transition-colors">
                            DNTA TOOL
                        </h2>
                        <p className="text-[10px] leading-tight text-muted-foreground">开发者工具箱</p>
                    </div>
                </Link>
            </div>

            {/* 分类导航 */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    工具分类
                </p>
                <ul className="space-y-0.5">
                    {categories.map((c) => {
                        const isActive = currentCategory === c.id;
                        return (
                            <li key={c.id}>
                                <button
                                    onClick={() => handleCategoryClick(c.id)}
                                    className={`nav-item group relative w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${
                                        isActive
                                            ? 'bg-accent text-accent-foreground font-medium'
                                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                                    }`}
                                >
                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r bg-foreground/80" />
                                    )}
                                    <i className={`${ICON_MAP[c.id] || 'i-lucide-folder'} text-[15px] flex-shrink-0`}></i>
                                    <span className="flex-1 text-left truncate">{c.title}</span>
                                    <span
                                        className={`text-[10px] tabular-nums ${
                                            isActive ? 'text-foreground/60' : 'text-muted-foreground/60'
                                        }`}
                                    >
                                        {countByCategory[c.id] || 0}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* 底部统计卡片 */}
            <div className="p-3">
                <div className="sidebar-stat rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <i className="i-lucide-sparkles text-sm"></i>
                        全部本地处理
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                        文件与数据仅在浏览器中处理，不上传服务器。
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-success"></span>
                        {toolsData.length} 个工具可用
                    </div>
                </div>
            </div>
        </aside>
    );
};

/** 面包屑信息 */
const getBreadcrumbs = (pathname: string) => {
    if (pathname === '/') return [{ name: '工具首页', path: '/' }];
    const match = pathname.match(/^\/tools\/(.+)$/);
    if (match) {
        const tool = (toolsData as { id: string; title: string }[]).find((t) => t.id === match[1]);
        return [
            { name: '工具首页', path: '/' },
            { name: tool?.title || '未知工具', path: pathname },
        ];
    }
    return [{ name: '工具首页', path: '/' }];
};

/**
 * 顶部栏：面包屑 + 搜索（Cmd/Ctrl+K 聚焦）+ 主题切换。
 */
const Header = () => {
    const searchValue = useUiStore((s) => s.q);
    const setQ = useUiStore((s) => s.setQ);
    const location = useLocation();
    const breadcrumbs = getBreadcrumbs(location.pathname);
    const isToolDetail = /^\/tools\/.+$/i.test(location.pathname);

    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState<string>(searchValue || '');
    const composingRef = useRef(false);
    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        setLocalValue(searchValue || '');
    }, [searchValue]);

    useEffect(() => {
        const onPop = () => useUiStore.getState().syncWithLocation();
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    // Cmd/Ctrl + K 聚焦搜索框
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const clearDebounce = () => {
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
    };

    return (
        <header className="header h-14 flex-shrink-0 bg-background/90 backdrop-blur border-b border-border z-30">
            <div className="h-full px-5 flex items-center justify-between gap-4">
                {/* 面包屑 */}
                <nav className="flex items-center gap-2 text-[13px] min-w-0">
                    {breadcrumbs.map((crumb, i) => (
                        <div key={crumb.path} className="flex items-center gap-2 min-w-0">
                            {i > 0 && <i className="i-lucide-chevron-right text-muted-foreground w-3.5 h-3.5 flex-shrink-0"></i>}
                            {i === breadcrumbs.length - 1 ? (
                                <span className="font-medium text-foreground truncate">{crumb.name}</span>
                            ) : (
                                <Link
                                    to={crumb.path}
                                    className="text-muted-foreground hover:text-foreground transition-colors truncate"
                                >
                                    {crumb.name}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* 搜索（工具页隐藏以保持工作区清爽） */}
                {!isToolDetail && (
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i className="i-lucide-search text-muted-foreground w-4 h-4"></i>
                        </div>
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder="搜索工具、标签或功能..."
                            value={localValue}
                            onChange={(e) => {
                                const v = e.target.value;
                                setLocalValue(v);
                                if (composingRef.current) return;
                                clearDebounce();
                                debounceRef.current = window.setTimeout(() => {
                                    setQ(v);
                                    debounceRef.current = null;
                                }, 200);
                            }}
                            onCompositionStart={() => {
                                composingRef.current = true;
                                clearDebounce();
                            }}
                            onCompositionEnd={(e: React.CompositionEvent<HTMLInputElement>) => {
                                composingRef.current = false;
                                const v = (e.target as HTMLInputElement).value;
                                setLocalValue(v);
                                clearDebounce();
                                setQ(v);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    clearDebounce();
                                    setQ(localValue);
                                }
                            }}
                            className="pl-9 pr-16 h-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring rounded-lg text-xs placeholder:text-muted-foreground"
                        />
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                            {localValue ? (
                                <button
                                    onClick={() => {
                                        clearDebounce();
                                        setLocalValue('');
                                        setQ('');
                                    }}
                                    className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors p-1"
                                    aria-label="清空搜索"
                                >
                                    <i className="i-lucide-x w-3.5 h-3.5"></i>
                                </button>
                            ) : (
                                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-background text-[10px] text-muted-foreground font-mono">
                                    ⌘K
                                </kbd>
                            )}
                        </div>
                    </div>
                )}
                {isToolDetail && <div className="flex-1" />}

                <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                        to="/"
                        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        title="打开工具首页"
                    >
                        <i className="i-lucide-house text-base"></i>
                    </Link>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
};

/**
 * 主布局：侧边栏 + 顶栏 + 标签栏 + keep-alive 工作区。
 */
const MainLayout = ({ categories }: { categories: { id: string; title: string }[] }) => {
    return (
        <div className="h-full bg-background flex min-w-7xl">
            <Sidebar categories={categories} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <TabBar />
                {/* 外层工作区滚动容器：首页内容溢出到这里，滚动条贴内容区最右侧 */}
                <main className="flex-1 p-5 bg-muted min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
                    <TabWorkspace />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

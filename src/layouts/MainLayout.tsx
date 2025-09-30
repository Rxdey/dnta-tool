import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import toolsData from '@/config/tools.json';
import useUiStore from '@/stores/useUiStore';

/**
 * 侧边栏组件
 * 显示工具分类导航菜单
 */
const Sidebar = ({ categories }: { categories: { id: string; title: string }[] }) => {
    const currentCategory = useUiStore((s) => s.category);
    const setCategory = useUiStore((s) => s.setCategory);

    return (
        <aside className="w-48 bg-background border-r border-border">
            {/* 侧边栏头部 */}
            <div className="p-4 border-b border-border">
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                        <i className="i-lucide-wrench text-background text-sm"></i>
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-foreground group-hover:text-muted-foreground transition-colors">
                            工具站
                        </h2>
                    </div>
                </Link>
            </div>

            {/* 导航菜单 */}
            <nav className="p-3">
                <ul className="space-y-1">
                    {categories.map((c) => {
                        const isActive = currentCategory === c.id;
                        const iconMap: { [key: string]: string } = {
                            all: 'i-lucide-grid-3x3',
                            images: 'i-lucide-image',
                            text: 'i-lucide-type',
                        };

                        return (
                            <li key={c.id}>
                                <button
                                    onClick={() => setCategory(c.id)}
                                    className={`w-full text-left flex items-center space-x-2 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                >
                                    <i className={`${iconMap[c.id] || 'i-lucide-folder'} text-sm`}></i>
                                    <span>{c.title}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};

/**
 * 获取面包屑导航信息
 */
const getBreadcrumbs = (pathname: string) => {
    if (pathname === '/') {
        return [{ name: '工具列表', path: '/' }];
    }

    // 匹配工具页面路径
    const toolMatch = pathname.match(/^\/tools\/(.+)$/);
    if (toolMatch) {
        const toolId = toolMatch[1];
        const tool = toolsData.find((t: any) => t.id === toolId);
        return [
            { name: '工具列表', path: '/' },
            { name: tool?.title || '未知工具', path: pathname },
        ];
    }

    return [{ name: '工具列表', path: '/' }];
};

/**
 * 顶部头部组件
 * 包含面包屑导航、搜索框和操作按钮
 */
const Header = () => {
    const searchValue = useUiStore((s) => s.q);
    const setQ = useUiStore((s) => s.setQ);
    const location = useLocation();
    const breadcrumbs = getBreadcrumbs(location.pathname);
    const isToolDetail = /^\/tools\/.+$/i.test(location.pathname);

    // 本地输入状态，用于处理 IME 组合输入
    const [localValue, setLocalValue] = useState<string>(searchValue || '');
    const composingRef = useRef(false);
    const debounceRef = useRef<number | null>(null);

    // 当 store 的值发生变化（例如 popstate 同步）时，更新本地输入框值
    useEffect(() => {
        setLocalValue(searchValue || '');
    }, [searchValue]);

    // 当浏览器前进/后退时同步 store
    useEffect(() => {
        const onPop = () => {
            // 使用 store 的 sync 方法
            useUiStore.getState().syncWithLocation();
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    // 清除防抖定时器的 helper
    const clearDebounce = () => {
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
    };

    return (
        <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* 面包屑导航 */}
                    <nav className="flex items-center space-x-2 text-sm">
                        {breadcrumbs.map((breadcrumb, index) => (
                            <div key={breadcrumb.path} className="flex items-center space-x-2">
                                {index > 0 && <i className="i-lucide-chevron-right text-muted-foreground w-4 h-4"></i>}
                                {index === breadcrumbs.length - 1 ? (
                                    <span className="font-medium text-foreground">{breadcrumb.name}</span>
                                ) : (
                                    <Link
                                        to={breadcrumb.path}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {breadcrumb.name}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* 搜索框（详情页隐藏） */}
                    {!isToolDetail && (
                        <div className="relative w-[500px]">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i className="i-lucide-search text-muted-foreground w-4 h-4"></i>
                            </div>
                            <Input
                                type="text"
                                placeholder="搜索工具、标签或功能..."
                                value={localValue}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setLocalValue(v);
                                    // 若处于 composition（输入法）中，暂不触发搜索
                                    if (composingRef.current) return;
                                    clearDebounce();
                                    // 防抖：250ms，只更新 store（不修改 URL）
                                    debounceRef.current = window.setTimeout(() => {
                                        setQ(v);
                                        debounceRef.current = null;
                                    }, 250);
                                }}
                                onCompositionStart={() => {
                                    composingRef.current = true;
                                    clearDebounce();
                                }}
                                onCompositionEnd={(e: React.CompositionEvent<HTMLInputElement>) => {
                                    composingRef.current = false;
                                    // composition 结束后立即提交当前值到 store（不修改 URL）
                                    const v = (e.target as HTMLInputElement).value;
                                    setLocalValue(v);
                                    clearDebounce();
                                    setQ(v);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // 按下回车时，仅把当前输入写入 store（但不修改 URL）
                                        clearDebounce();
                                        setQ(localValue);
                                    }
                                }}
                                className="pl-12 pr-12 py-3 bg-background border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl text-sm placeholder:text-muted-foreground"
                            />
                            {localValue && (
                                <button
                                    onClick={() => {
                                        clearDebounce();
                                        setLocalValue('');
                                        // 清空时仅清空搜索词（不修改 URL）
                                        setQ('');
                                    }}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <i className="i-lucide-x w-4 h-4"></i>
                                </button>
                            )}
                        </div>
                    )}

                    {/* 右侧操作按钮 */}
                    <div className="flex items-center space-x-2">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
};

/**
 * 主布局组件
 * 包含侧边栏、顶部导航和主内容区域
 */
const MainLayout = ({ categories }: { categories: { id: string; title: string }[] }) => {
    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar categories={categories} />
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6 bg-muted/30">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUiStore from '@/stores/useUiStore';
import toolsData from '@/config/tools.json';
import categoriesData from '@/config/categories.json';
import ToolCard, { type ToolCardView, type ToolItem } from '@/components/tools/ToolCard';
import { Badge } from '@/components/ui/badge';

/** 视图偏好在 localStorage 中的键 */
const VIEW_STORAGE_KEY = 'tool-list-view';

/** 分类标题映射 */
const CATEGORY_TITLE: Record<string, string> = {
    all: '全部工具',
    images: '图片工具',
    text: '文本工具',
    qr: 'QR 工具',
    document: '文档工具',
};

/** 分类图标映射 */
const CATEGORY_ICON: Record<string, string> = {
    all: 'i-lucide-layout-grid',
    images: 'i-lucide-image',
    text: 'i-lucide-type',
    qr: 'i-lucide-qr-code',
    document: 'i-lucide-file-text',
};

const readViewPreference = (): ToolCardView => {
    if (typeof window === 'undefined') return 'list';
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'grid' ? 'grid' : 'list';
};

/**
 * 工具列表页：分类快捷筛选 + 工具列表/网格 + 视图切换。
 */
const ToolsListPage = () => {
    const category = useUiStore((s) => s.category);
    const q = (useUiStore((s) => s.q) || '').trim().toLowerCase();
    const setCategory = useUiStore((s) => s.setCategory);
    const navigate = useNavigate();
    const [view, setView] = useState<ToolCardView>(readViewPreference);

    /** 分类筛选 + 搜索 */
    const filteredTools = useMemo(() => {
        let list = toolsData as ToolItem[];
        if (category !== 'all') {
            list = list.filter((tool) => tool.category === category);
        }
        if (!q) return list;
        return list.filter((tool) => {
            const inTitle = tool.title?.toLowerCase().includes(q);
            const inDesc = tool.description?.toLowerCase().includes(q);
            const inTags = (tool.tags || []).some((t) => t.toLowerCase().includes(q));
            return inTitle || inDesc || inTags;
        });
    }, [category, q]);

    /** 全部视图下按分类分组 */
    const groupedTools = useMemo(() => {
        if (category !== 'all' || q) return null;
        return categoriesData
            .filter((c) => c.id !== 'all')
            .map((c) => ({
                category: c,
                tools: (toolsData as ToolItem[]).filter((t) => t.category === c.id),
            }))
            .filter((g) => g.tools.length > 0);
    }, [category, q]);

    const changeView = (next: ToolCardView) => {
        setView(next);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(VIEW_STORAGE_KEY, next);
        }
    };

    const handleCategory = (id: string) => {
        setCategory(id);
        navigate(id && id !== 'all' ? `/?category=${id}` : '/', { replace: true });
    };

    const renderGrid = (list: ToolItem[]) => (
        <div className={view === 'list' ? 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3'}>
            {list.map((tool) => (
                <ToolCard key={tool.id} tool={tool} view={view} />
            ))}
        </div>
    );

    return (
        <div className="space-y-4 pb-6">
            {/* 工具栏：分类 chips + 视图切换 */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                    {categoriesData.map((c) => {
                        const active = category === c.id;
                        return (
                            <button
                                key={c.id}
                                onClick={() => handleCategory(c.id)}
                                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
                                    active
                                        ? 'bg-foreground text-background'
                                        : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                                }`}
                            >
                                <i className={`${CATEGORY_ICON[c.id] || 'i-lucide-folder'} text-sm`}></i>
                                {c.title}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border bg-background flex-shrink-0">
                    <button
                        onClick={() => changeView('list')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            view === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="列表视图"
                    >
                        <i className="i-lucide-list text-sm"></i>列表
                    </button>
                    <button
                        onClick={() => changeView('grid')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            view === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="网格视图"
                    >
                        <i className="i-lucide-layout-grid text-sm"></i>网格
                    </button>
                </div>
            </div>

            {/* 标题行 */}
            {(q || category !== 'all') && (
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                        {CATEGORY_TITLE[category] || '全部工具'}
                    </h2>
                    <Badge variant="secondary" className="text-xs">{filteredTools.length} 个工具</Badge>
                    {q && <span className="text-xs text-muted-foreground">搜索 “{q}”</span>}
                </div>
            )}

            {/* 工具列表 */}
            {filteredTools.length > 0 ? (
                groupedTools ? (
                    <div className="space-y-6">
                        {groupedTools.map((group) => (
                            <section key={group.category.id}>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <i className={`${CATEGORY_ICON[group.category.id]} text-sm text-muted-foreground`}></i>
                                    <h2 className="text-sm font-semibold text-foreground">{group.category.title}</h2>
                                    <span className="text-[11px] text-muted-foreground">{group.tools.length}</span>
                                    <div className="flex-1 h-px bg-border/70 ml-1"></div>
                                </div>
                                {renderGrid(group.tools)}
                            </section>
                        ))}
                    </div>
                ) : renderGrid(filteredTools)
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-border bg-background/40">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <i className="i-lucide-search-x text-2xl text-muted-foreground"></i>
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">没有找到匹配的工具</h3>
                    <p className="text-muted-foreground text-center max-w-md text-sm">
                        试试其他关键词，或切换到“全部工具”看看。
                    </p>
                    <button
                        onClick={() => {
                            useUiStore.getState().setQ('');
                            handleCategory('all');
                        }}
                        className="mt-5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center"
                    >
                        <i className="i-lucide-arrow-left mr-2"></i>
                        查看全部工具
                    </button>
                </div>
            )}
        </div>
    );
};

export default ToolsListPage;

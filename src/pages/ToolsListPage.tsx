import { useMemo } from 'react';
import useUiStore from '@/stores/useUiStore';
import toolsData from '@/config/tools.json';
import ToolCard from '@/components/tools/ToolCard';
import { Badge } from '@/components/ui/badge';

/**
 * 工具列表页面
 * 展示所有可用工具的卡片网格，支持分类筛选和搜索
 */
const ToolsListPage = () => {
    const category = useUiStore((s) => s.category);
    const q = (useUiStore((s) => s.q) || '').trim().toLowerCase();

    // 根据分类和搜索词筛选工具
    const filteredTools = useMemo(() => {
        let list = toolsData;
        if (category !== 'all') {
            list = list.filter((tool: any) => tool.category === category);
        }

        if (!q) return list;

        return list.filter((tool: any) => {
            const inTitle = tool.title?.toLowerCase().includes(q);
            const inDesc = tool.description?.toLowerCase().includes(q);
            const inTags = (tool.tags || []).some((t: string) => t.toLowerCase().includes(q));
            return inTitle || inDesc || inTags;
        });
    }, [category, q]);

    const getCategoryTitle = (categoryId: string) => {
        const categoryMap: { [key: string]: string } = {
            'all': '全部工具',
            'images': '图片工具',
            'text': '文本工具',
        };
        return categoryMap[categoryId] || '未知分类';
    };

    const getCategoryDescription = (categoryId: string) => {
        const descMap: { [key: string]: string } = {
            'all': '发现所有可用的实用工具',
            'images': '图片处理、编辑和转换工具',
            'text': '文本处理、格式化和转换工具',
        };
        return descMap[categoryId] || '';
    };

    return (
        <div className="space-y-6">
            {/* 页面头部 */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-3">
                        <h1 className="text-3xl font-bold text-foreground">
                            {getCategoryTitle(category)}
                        </h1>
                        <Badge variant="secondary">
                            {filteredTools.length} 个工具
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        {getCategoryDescription(category)}
                    </p>
                </div>
            </div>

            {/* 工具网格 */}
            {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTools.map((tool: any) => (
                        <ToolCard key={tool.id} tool={tool} />
                    ))}
                </div>
            ) : (
                // 空状态
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                        <i className="i-lucide-search-x text-3xl text-muted-foreground"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">暂无工具</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                        该分类下暂时没有可用的工具，我们正在努力添加更多实用工具。
                    </p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="mt-6 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <i className="i-lucide-arrow-left mr-2"></i>
                        查看全部工具
                    </button>
                </div>
            )}

            {/* 底部统计信息 */}
            {filteredTools.length > 0 && (
                <div className="border-t border-border pt-6 mt-12">
                    <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                            <i className="i-lucide-zap"></i>
                            <span>全部免费使用</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <i className="i-lucide-shield-check"></i>
                            <span>安全可靠</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <i className="i-lucide-clock"></i>
                            <span>持续更新</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolsListPage;

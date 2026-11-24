import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';

/** 工具卡片展示形态：list=紧凑行（默认），grid=紧凑卡片 */
export type ToolCardView = 'list' | 'grid';

/** 工具元数据（对应 tools.json 的一条记录） */
export interface ToolItem {
    /** 工具唯一标识 */
    id: string;
    /** 工具名称 */
    title: string;
    /** 一句话描述 */
    description: string;
    /** 所属分类 id */
    category: string;
    /** 搜索标签 */
    tags: string[];
    /** iconify 图标类名 */
    icon: string;
    /** 路由路径 */
    path: string;
    /** 是否标记为推荐 */
    featured?: boolean;
}

interface ToolCardProps {
    /** 工具数据 */
    tool: ToolItem;
    /** 展示形态，默认 list */
    view?: ToolCardView;
}

/** 推荐角标 */
const FeaturedBadge = () => (
    <Badge variant="outline" className="px-1.5 py-0 text-[10px] shrink-0">
        <i className="i-lucide-star mr-0.5 text-[10px]"></i>
        推荐
    </Badge>
);

/**
 * 工具卡片组件
 * 支持紧凑列表行（list）与紧凑卡片（grid）两种形态。
 */
const ToolCard = ({ tool, view = 'list' }: ToolCardProps) => {
    const iconClass = tool.icon || 'i-lucide-box';

    // 紧凑列表行：一整行可点击，图标 + 标题/描述 + 标签 + 箭头
    if (view === 'list') {
        return (
            <Link
                to={tool.path}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-foreground/25 hover:shadow-sm transition-all"
            >
                {/* 图标 */}
                <div className="tool-icon w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-foreground text-background group-hover:scale-105 transition-transform">
                    <i className={`${iconClass} text-base`}></i>
                </div>

                {/* 标题 + 描述 */}
                <div className="flex-1 min-w-0">

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-card-foreground truncate group-hover:underline underline-offset-2">
                                {tool.title}
                            </h3>
                        </div>

                        {/* 标签（中屏以上显示） */}
                        {tool.tags && tool.tags.length > 0 && (
                            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                                {tool.tags.slice(0, 1).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>



                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{tool.description}</p>
                        {/* 箭头 */}
                        <i className="i-lucide-chevron-right text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform"></i>
                    </div>

                </div>


            </Link>
        );
    }

    // 紧凑卡片：去掉大装饰背景与整宽按钮，整卡可点击
    return (
        <Link
            to={tool.path}
            className="group relative flex flex-col p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-foreground/25 hover:shadow-md transition-all"
        >
            {/* 顶部：图标 + 推荐 */}
            <div className="flex items-center gap-3">
                <div className="tool-icon w-10 h-10 flex items-center justify-center rounded-lg bg-foreground text-background group-hover:scale-105 transition-transform">
                    <i className={`${iconClass} text-lg`}></i>
                </div>
                <h2 className="font-semibold text-lg text-card-foreground truncate group-hover:underline underline-offset-2">
                    {tool.title}
                </h2>
            </div>

            {/* 标题 + 描述 */}
            <div className="mb-3 flex-1">

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-1">{tool.description}</p>
            </div>

            {/* 标签 + 箭头 */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1 min-w-0">
                    {tool.tags?.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                            {tag}
                        </Badge>
                    ))}
                </div>
                <i className="i-lucide-chevron-right text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform"></i>
            </div>
        </Link>
    );
};

export default ToolCard;

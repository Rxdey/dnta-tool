import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';

/**
 * 工具卡片组件
 * 展示工具的基本信息，包括图标、标题、描述、标签等
 */
const ToolCard = ({ tool }: { tool: any }) => {
    return (
        <div className="group relative bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
            {/* 装饰性背景 */}
            <div className="absolute right-0 top-0 opacity-50">
                <i className="i-lucide-wrench text-zinc-100 text-[180px] rotate-12 dark:text-zinc-800"></i>
            </div>

            <div className="relative">
                {/* 顶部图标区域 */}
                <div className="flex gap-2 items-start mb-4 justify-between">
                    <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
                        <i className={`${tool.icon || 'i-lucide-box'} text-xl`}></i>
                    </div>

                    {tool.featured && (
                        <Badge variant="outline" className="px-2 py-1 text-xs">
                            <i className="i-lucide-star mr-1 text-xs"></i>
                            推荐
                        </Badge>
                    )}
                </div>

                {/* 内容区域 */}
                <div className="mb-4">
                    <h3 className="font-bold text-lg text-card-foreground mb-2 transition-colors">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{tool.description}</p>
                </div>

                {/* 标签区域 */}
                {tool.tags && tool.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {tool.tags.slice(0, 3).map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                                {tag}
                            </Badge>
                        ))}
                        {tool.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                +{tool.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* 操作按钮 */}
                <Link
                    to={tool.path}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-lg transition-all duration-200 group/btn"
                >
                    <span>开始使用</span>
                </Link>
            </div>
        </div>
    );
};

export default ToolCard;

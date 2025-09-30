import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import toolsData from '@/config/tools.json';

/**
 * 侧边栏组件
 * 显示工具分类导航菜单
 */
const Sidebar = ({ categories }: { categories: { id: string; title: string }[] }) => {
    const location = useLocation();
    const currentCategory = new URLSearchParams(location.search).get('category') || 'all';

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
                            'all': 'i-lucide-grid-3x3',
                            'images': 'i-lucide-image',
                            'text': 'i-lucide-type',
                        };
                        
                        return (
                            <li key={c.id}>
                                <Link 
                                    to={c.id === 'all' ? '/' : `/?category=${c.id}`}
                                    className={`flex items-center space-x-2 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                                        isActive 
                                            ? 'bg-accent text-accent-foreground' 
                                            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                                    }`}
                                >
                                    <i className={`${iconMap[c.id] || 'i-lucide-folder'} text-sm`}></i>
                                    <span>{c.title}</span>
                                </Link>
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
            { name: tool?.title || '未知工具', path: pathname }
        ];
    }
    
    return [{ name: '工具列表', path: '/' }];
};

/**
 * 顶部头部组件
 * 包含面包屑导航、搜索框和操作按钮
 */
const Header = () => {
    const [searchValue, setSearchValue] = useState('');
    const location = useLocation();
    const breadcrumbs = getBreadcrumbs(location.pathname);

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

                    {/* 搜索框 */}
                    <div className="relative w-[500px]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i className="i-lucide-search text-muted-foreground w-4 h-4"></i>
                        </div>
                        <Input
                            type="text"
                            placeholder="搜索工具、标签或功能..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="pl-12 pr-12 py-3 bg-background border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl text-sm placeholder:text-muted-foreground"
                        />
                        {searchValue && (
                            <button 
                                onClick={() => setSearchValue('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <i className="i-lucide-x w-4 h-4"></i>
                            </button>
                        )}
                    </div>

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

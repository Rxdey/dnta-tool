import { useNavigate } from 'react-router-dom';

import { useTabsStore } from '@/stores/useTabsStore';

/**
 * IDE 风格标签栏。
 * - 点击标签：navigate 到对应路径，由 TabWorkspace 的 location 监听激活
 * - 关闭标签：store 移除面板（组件卸载），若关闭的是当前标签则导航到相邻标签
 * - 滚轮横向滚动、隐藏滚动条
 */
const TabBar = () => {
    const navigate = useNavigate();
    const tabs = useTabsStore((s) => s.tabs);
    const activeKey = useTabsStore((s) => s.activeKey);
    const closeTab = useTabsStore((s) => s.closeTab);

    const handleClose = (key: string) => {
        const nextPath = closeTab(key);
        if (nextPath !== null) {
            navigate(nextPath, { replace: true });
        }
    };

    return (
        <div className="tabbar flex items-center h-10 flex-shrink-0 border-b border-border bg-muted/30 px-2 gap-1 overflow-x-auto overflow-y-hidden">
            {tabs.map((tab) => {
                const active = tab.key === activeKey;
                return (
                    <div
                        key={tab.key}
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                            if (!active) navigate(tab.path);
                        }}
                        onAuxClick={(e) => {
                            // 中键关闭
                            if (e.button === 1 && tab.closable) {
                                e.preventDefault();
                                handleClose(tab.key);
                            }
                        }}
                        className={`tabbar-tab group relative flex items-center gap-1.5 h-7 max-w-[180px] pl-2.5 pr-1.5 rounded-md text-xs whitespace-nowrap cursor-pointer select-none flex-shrink-0 transition-colors ${
                            active
                                ? 'bg-background text-foreground'
                                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                        }`}
                        title={tab.title}
                    >
                        {active && (
                            <span className="absolute left-2 right-2 -bottom-[5px] h-0.5 rounded-full bg-foreground/80" />
                        )}
                        <i className={`${tab.icon} text-sm flex-shrink-0 ${active ? 'text-foreground' : 'text-muted-foreground'}`}></i>
                        <span className="truncate">{tab.title}</span>
                        {tab.closable && (
                            <button
                                type="button"
                                aria-label={`关闭 ${tab.title}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClose(tab.key);
                                }}
                                className="ml-0.5 w-4 h-4 flex-shrink-0 rounded flex items-center justify-center text-muted-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
                            >
                                <i className="i-lucide-x text-[11px]"></i>
                            </button>
                        )}
                    </div>
                );
            })}
            <div className="flex-1 min-w-2" />
        </div>
    );
};

export default TabBar;

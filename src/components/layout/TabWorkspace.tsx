import { Suspense, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import ToolsListPage from '@/pages/ToolsListPage';
import { tabMetaFromPath, toolComponentMap } from '@/config/toolComponents';
import { HOME_TAB, useTabsStore } from '@/stores/useTabsStore';

/** 懒加载占位 */
const PanelLoading = () => (
    <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <i className="i-lucide-loader-circle animate-spin text-base"></i>
        <span>加载中...</span>
    </div>
);

/**
 * 标签工作区（keep-alive）。
 *
 * 与 React Router 的 Outlet 不同，这里把所有打开过的页面**同时挂载**：
 * - 每张标签对应一个面板，非激活面板用 visibility/pointer-events 隐藏而非卸载，
 *   因此组件状态、输入内容在切换标签后完整保留；
 * - 非激活面板绝对定位脱离文档流，不参与布局/滚动高度计算，避免隐藏页干扰外层滚动。
 *
 * 滚动策略：
 * - 首页（内容型页面）自然高度，溢出到外层 <main> 滚动，滚动条贴内容区最右侧；
 * - 工具页（h-full + 内部分栏）填满可视区，由工具内部各自滚动，保持原有交互。
 *
 * URL（HashRouter）仍是唯一真相来源：location 变化会打开并激活对应标签，
 * 浏览器前进/后退、侧边栏分类跳转、卡片点击都走同一条路径。
 */
const TabWorkspace = () => {
    const location = useLocation();
    const tabs = useTabsStore((s) => s.tabs);
    const activeKey = useTabsStore((s) => s.activeKey);
    const openTab = useTabsStore((s) => s.openTab);

    const containerRef = useRef<HTMLDivElement>(null);
    const homeScrollRef = useRef(0);
    const prevActiveRef = useRef(activeKey);

    // URL -> 打开并激活标签
    useEffect(() => {
        const pathname = location.pathname;
        if (pathname === '/') {
            openTab(HOME_TAB);
            return;
        }
        const meta = tabMetaFromPath(pathname);
        if (meta) {
            openTab({ ...meta, closable: true });
        } else {
            // 未知路径兜底回首页标签
            openTab(HOME_TAB);
        }
    }, [location.pathname, openTab]);

    // 切换标签时管理外层 <main> 滚动：离开首页记下位置，回到首页恢复，工具页回顶部
    useEffect(() => {
        const main = containerRef.current?.parentElement;
        if (!main) return;

        const prev = prevActiveRef.current;
        if (prev === '/' && activeKey !== '/') {
            homeScrollRef.current = main.scrollTop;
        }
        prevActiveRef.current = activeKey;

        main.scrollTop = activeKey === '/' ? homeScrollRef.current : 0;
    }, [activeKey]);

    return (
        <div ref={containerRef} className="relative w-full min-h-full">
            {tabs.map((tab) => {
                const active = tab.key === activeKey;
                const isHome = tab.key === '/';
                const ToolComponent = toolComponentMap[tab.key];

                // 首页激活时走自然高度（内容溢出到外层 main 滚动）；其余情况绝对定位填满可视区
                const flowClass =
                    active && isHome
                        ? 'relative w-full min-h-full'
                        : 'absolute inset-0 w-full overflow-hidden';

                return (
                    <section
                        key={tab.key}
                        aria-hidden={!active}
                        className={`tab-panel min-h-0 min-w-0 ${flowClass}`}
                        style={{
                            visibility: active ? 'visible' : 'hidden',
                            zIndex: active ? 1 : 0,
                            pointerEvents: active ? 'auto' : 'none',
                        }}
                    >
                        <Suspense fallback={<PanelLoading />}>
                            {isHome ? (
                                <ToolsListPage />
                            ) : ToolComponent ? (
                                <ToolComponent />
                            ) : (
                                <PanelLoading />
                            )}
                        </Suspense>
                    </section>
                );
            })}
        </div>
    );
};

export default TabWorkspace;

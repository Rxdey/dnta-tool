import { create } from 'zustand';

/** 工作台标签项 */
export interface WorkspaceTab {
    /** 唯一标识，等于 pathname */
    key: string;
    /** 跳转路径 */
    path: string;
    /** 标签标题 */
    title: string;
    /** iconify 图标类名 */
    icon: string;
    /** 是否可关闭（首页固定不可关闭） */
    closable: boolean;
}

/** 固定的首页标签 */
export const HOME_TAB: WorkspaceTab = {
    key: '/',
    path: '/',
    title: '工具首页',
    icon: 'i-lucide-house',
    closable: false,
};

interface TabsState {
    tabs: WorkspaceTab[];
    activeKey: string;
    /** 打开标签（已存在则仅激活） */
    openTab: (tab: WorkspaceTab) => void;
    /** 激活标签 */
    activateTab: (key: string) => void;
    /** 关闭标签；若关闭的是当前激活项，返回应跳转的新 path */
    closeTab: (key: string) => string | null;
}

export const useTabsStore = create<TabsState>((set, get) => ({
    tabs: [HOME_TAB],
    activeKey: HOME_TAB.key,

    openTab: (tab) =>
        set((state) => {
            const exists = state.tabs.some((t) => t.key === tab.key);
            return {
                tabs: exists ? state.tabs : [...state.tabs, tab],
                activeKey: tab.key,
            };
        }),

    activateTab: (key) =>
        set((state) => (state.activeKey === key ? state : { activeKey: key })),

    closeTab: (key) => {
        const state = get();
        const target = state.tabs.find((t) => t.key === key);
        if (!target || !target.closable) return null;

        const idx = state.tabs.findIndex((t) => t.key === key);
        const nextTabs = state.tabs.filter((t) => t.key !== key);

        let nextActiveKey = state.activeKey;
        let nextPath: string | null = null;
        if (state.activeKey === key) {
            // 优先激活右邻，其次左邻，兜底首页
            const next = nextTabs[idx] ?? nextTabs[idx - 1] ?? nextTabs[0] ?? HOME_TAB;
            nextActiveKey = next.key;
            nextPath = next.path;
        }

        set({ tabs: nextTabs, activeKey: nextActiveKey });
        return nextPath;
    },
}));

export default useTabsStore;

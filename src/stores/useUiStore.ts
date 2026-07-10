import { create } from 'zustand';

type UiState = {
  q: string;
  category: string;
  setQ: (q: string) => void;
  setCategory: (c: string) => void;
  syncWithLocation: () => void;
};

const readLocation = () => {
  if (typeof window === 'undefined') return { q: '', category: 'all' };
  // 项目使用 HashRouter，路由信息在 location.hash 中（如 #/?category=text）
  const hash = window.location.hash.replace(/^#/, '');
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(queryString);
  // 不从 URL 读取 q，保证搜索永远不影响 URL
  return {
    q: '',
    category: params.get('category') || 'all',
  };
};

const useUiStore = create<UiState>()((set) => {
  const loc = readLocation();

  return {
    q: loc.q,
    category: loc.category,
    setQ: (q: string) => {
      set(() => ({ q }));
    },
    setCategory: (category: string) => {
      set(() => ({ category }));
    },
    syncWithLocation: () => {
      const loc = readLocation();
      // 只同步 category，不同步 q
      set(() => ({ category: loc.category }));
    },
  };
});

export default useUiStore;

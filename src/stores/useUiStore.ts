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
  const params = new URLSearchParams(window.location.search);
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
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      if (category && category !== 'all') params.set('category', category);
      else params.delete('category');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    },
    syncWithLocation: () => {
      const loc = readLocation();
      // 只同步 category，不同步 q
      set(() => ({ category: loc.category }));
    },
  };
});

export default useUiStore;

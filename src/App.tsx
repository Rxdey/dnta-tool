import { HashRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import MainLayout from '@/layouts/MainLayout';
import categories from '@/config/categories.json';

/**
 * 应用根组件。
 *
 * 早期用 <Routes>/<Route> + <Outlet> 渲染单一页面，切换路由会卸载旧组件导致状态丢失。
 * 现在页面由 MainLayout 内的 TabWorkspace 驱动：所有打开过的标签同时挂载、按激活态显隐，
 * 从而实现「多标签打开 + 切换保留状态」。Router 仍保留，用于同步 URL（前进/后退/深链）。
 */
const App = () => {
    return (
        <>
            <Router>
                <MainLayout categories={categories} />
            </Router>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        color: 'var(--foreground)',
                    },
                }}
            />
        </>
    );
};

export default App;

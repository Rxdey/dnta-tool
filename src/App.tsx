import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import MainLayout from '@/layouts/MainLayout';
import ToolsListPage from '@/pages/ToolsListPage';
import categories from '@/config/categories.json';
import { lazy, Suspense } from 'react';

// lazy load tool entry components by path mapping - since tools.json is static and doesn't provide imports,
// we'll map known tool ids to actual components. For now map image-to-base64 directly.
const ImageToBase64 = lazy(() => import('@/tools/image-to-base64'));
const ImageCompressor = lazy(() => import('@/tools/image-compressor'));

const App = () => {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<MainLayout categories={categories} />}>
                        <Route index element={<ToolsListPage />} />
                        <Route
                            path="tools/image-to-base64"
                            element={
                                <Suspense fallback={<div>Loading...</div>}>
                                    <ImageToBase64 />
                                </Suspense>
                            }
                        />
                        <Route
                            path="tools/image-compressor"
                            element={
                                <Suspense fallback={<div>Loading...</div>}>
                                    <ImageCompressor />
                                </Suspense>
                            }
                        />
                    </Route>
                </Routes>
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


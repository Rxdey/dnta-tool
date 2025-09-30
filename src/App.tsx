import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import ToolsListPage from '@/pages/ToolsListPage';
import categories from '@/config/categories.json';
import { lazy, Suspense } from 'react';

// lazy load tool entry components by path mapping - since tools.json is static and doesn't provide imports,
// we'll map known tool ids to actual components. For now map image-to-base64 directly.
const ImageToBase64 = lazy(() => import('@/tools/image-to-base64'));

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainLayout categories={categories} />}>
                    <Route index element={<ToolsListPage />} />
                    <Route
                        path="tools/image-to-base64"
                        element={
                            <Suspense>
                                <ImageToBase64 />
                            </Suspense>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;


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
const QRTools = lazy(() => import('@/tools/qr-tools'));
const JsonToTs = lazy(() => import('@/tools/json-to-ts'));
const JsonViewer = lazy(() => import('@/tools/json-viewer'));
const PdfToImage = lazy(() => import('@/tools/pdf-to-image'));

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
                        <Route
                            path="tools/qr-tools"
                            element={
                                <Suspense fallback={<div>Loading...</div>}>
                                    <QRTools />
                                </Suspense>
                            }
                        />
                        <Route
                            path="tools/json-to-ts"
                            element={
                                <Suspense fallback={<div>Loading...</div>}>
                                    <JsonToTs />
                                </Suspense>
                            }
                        />
                        <Route
                            path="tools/json-viewer"
                            element={
                                <Suspense fallback={<div>Loading...</div>}>
                                    <JsonViewer />
                                </Suspense>
                            }
                        />
                        <Route
                            path="tools/pdf-to-image"
                            element={
                                <Suspense fallback={<div>Loading...</div>}>
                                    <PdfToImage />
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


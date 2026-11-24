import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import toolsData from '@/config/tools.json';
import { type WorkspaceTab } from '@/stores/useTabsStore';

/** 工具页组件类型 */
export type ToolComponent = LazyExoticComponent<ComponentType>;

/**
 * path -> 工具组件映射。
 * 工具页组件在 App.tsx 中已不再通过 Routes 注册，改由此处驱动 keep-alive 工作区。
 */
export const toolComponentMap: Record<string, ToolComponent> = {
    '/tools/image-to-base64': lazy(() => import('@/tools/image-to-base64')),
    '/tools/image-compressor': lazy(() => import('@/tools/image-compressor')),
    '/tools/qr-tools': lazy(() => import('@/tools/qr-tools')),
    '/tools/json-to-ts': lazy(() => import('@/tools/json-to-ts')),
    '/tools/json-viewer': lazy(() => import('@/tools/json-viewer')),
    '/tools/pdf-to-image': lazy(() => import('@/tools/pdf-to-image')),
    '/tools/url-params-editor': lazy(() => import('@/tools/url-params-editor')),
};

interface ToolMeta {
    id: string;
    title: string;
    icon: string;
    path: string;
}

/**
 * 根据 pathname 生成标签元数据（从 tools.json 查标题与图标）。
 * 未知路径返回 null。
 */
export const tabMetaFromPath = (pathname: string): Omit<WorkspaceTab, 'closable'> | null => {
    const tool = (toolsData as ToolMeta[]).find((t) => t.path === pathname);
    if (!tool) return null;
    return {
        key: tool.path,
        path: tool.path,
        title: tool.title,
        icon: tool.icon || 'i-lucide-box',
    };
};

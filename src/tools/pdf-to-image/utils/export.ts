import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { RenderedPage } from './render';

/** 支持的图片导出格式 */
export type ImageFormat = 'png' | 'jpeg' | 'webp';

/** 格式对应的文件扩展名 */
const EXT_MAP: Record<ImageFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
};

/** 格式对应的 MIME */
const MIME_MAP: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * 将 canvas 转换为 Blob。
 * @param quality 质量（0~1），仅 jpeg/webp 生效
 */
export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality = 0.92,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas 转图片失败'))),
      MIME_MAP[format],
      quality,
    );
  });
};

/** 触发浏览器下载单个 blob */
export const downloadBlob = (blob: Blob, filename: string): void => {
  saveAs(blob, filename);
};

/** 生成单页文件名：`<基准名>-<三位页码>.<ext>` */
const pageFileName = (baseName: string, pageNumber: number, format: ImageFormat): string =>
  `${baseName}-${String(pageNumber).padStart(3, '0')}.${EXT_MAP[format]}`;

/**
 * 逐页下载（每张单独保存）。
 * 每张之间间隔少量时间，避免浏览器一次性拦截多个下载。
 */
export const downloadPagesIndividually = async (
  pages: RenderedPage[],
  format: ImageFormat,
  baseName: string,
  quality = 0.92,
): Promise<void> => {
  for (const page of pages) {
    const blob = await canvasToBlob(page.canvas, format, quality);
    downloadBlob(blob, pageFileName(baseName, page.pageNumber, format));
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

/**
 * 将所有页打包为 zip 后下载。
 */
export const downloadPagesAsZip = async (
  pages: RenderedPage[],
  format: ImageFormat,
  baseName: string,
  quality = 0.92,
): Promise<void> => {
  const zip = new JSZip();
  for (const page of pages) {
    const blob = await canvasToBlob(page.canvas, format, quality);
    zip.file(pageFileName(baseName, page.pageNumber, format), blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(zipBlob, `${baseName}.zip`);
};

/**
 * 将全部页面纵向拼接为一张长图。
 * @param gap 页与页之间的间隙像素（>=0）
 * @param background 间隙背景色（jpeg 下透明会变黑，建议白色）
 */
export const composeLongImage = async (
  pages: RenderedPage[],
  gap: number,
  background: string,
  format: ImageFormat,
  quality = 0.92,
): Promise<Blob> => {
  if (pages.length === 0) throw new Error('没有可导出的页面');

  const totalWidth = Math.max(...pages.map((p) => p.width));
  const totalHeight =
    pages.reduce((sum, p) => sum + p.height, 0) + Math.max(0, gap) * (pages.length - 1);

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 canvas 上下文，当前环境可能不支持 2D 渲染');

  // 先铺底色（jpeg/有间隙时必需）
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  let offsetY = 0;
  for (const page of pages) {
    // 不同页宽时居中绘制，左右留白由底色填充
    const offsetX = Math.floor((totalWidth - page.width) / 2);
    ctx.drawImage(page.canvas, offsetX, offsetY);
    offsetY += page.height + Math.max(0, gap);
  }

  return canvasToBlob(canvas, format, quality);
};

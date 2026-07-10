import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy } from 'pdfjs-dist';

/** worker 是否已初始化（只需一次） */
let workerInitialized = false;

/**
 * 初始化 pdf.js worker。
 * Vite 下通过 `?url` 直接拿到 worker 文件地址，避免跨域/路径问题。
 */
const ensureWorker = (): void => {
  if (workerInitialized) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  workerInitialized = true;
};

/** 单页渲染结果 */
export interface RenderedPage {
  /** 页码（从 1 开始） */
  pageNumber: number;
  /** 已渲染好的 canvas */
  canvas: HTMLCanvasElement;
  /** 像素宽 */
  width: number;
  /** 像素高 */
  height: number;
}

/**
 * 加载 PDF 文档。
 * @param data 文件的 ArrayBuffer（内部会复制一份，避免 pdf.js 接管后影响原始数据）
 */
export const loadPdfDocument = async (data: ArrayBuffer): Promise<PDFDocumentProxy> => {
  ensureWorker();
  return pdfjsLib.getDocument({ data: data.slice(0) }).promise;
};

/**
 * 将指定页渲染到新建的 canvas。
 * @param scale 渲染倍率（1 = 100% 原始分辨率，2 = 200% 更清晰）
 */
export const renderPageToCanvas = async (
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
): Promise<RenderedPage> => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const renderTask = page.render({ canvas, viewport });
  await renderTask.promise;
  return {
    pageNumber,
    canvas,
    width: canvas.width,
    height: canvas.height,
  };
};

/**
 * 按顺序渲染全部页面。
 */
export const renderAllPages = async (
  pdf: PDFDocumentProxy,
  scale: number,
): Promise<RenderedPage[]> => {
  const pages: RenderedPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    pages.push(await renderPageToCanvas(pdf, i, scale));
  }
  return pages;
};

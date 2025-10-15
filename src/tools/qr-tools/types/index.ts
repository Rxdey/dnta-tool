export type TabType = 'generate' | 'parse' | 'file-to-base64' | 'base64-to-file';

export interface QRFile {
  name: string;
  dataUrl: string;
}

export interface ParsedImage {
  id: string;
  file: File;
  preview: string;
  index: number;
  originalIndex: number; // 原始索引，用于显示拖拽前的位置
}

export interface ParseResult {
  text: string;
  source: string; // 来源文件名
}

export interface QRToolState {
  activeTab: TabType;
  qrFiles: QRFile[];
  parsedImages: ParsedImage[];
  parseResult: ParseResult | null;
  base64Result: string;
}

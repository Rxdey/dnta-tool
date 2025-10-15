import imageCompression from 'browser-image-compression';

/**
 * 将文件转换为Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:type/subtype;base64, 前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 压缩图片文件
 */
export async function compressImageFile(
  file: File, 
  options: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  } = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    ...options
  };

  try {
    return await imageCompression(file, defaultOptions);
  } catch (error) {
    console.error('图片压缩失败:', error);
    throw new Error('图片压缩失败');
  }
}

/**
 * Base64转文件并下载
 */
export function downloadBase64AsFile(
  base64: string, 
  filename: string, 
  mimeType: string = 'application/octet-stream'
) {
  try {
    // 添加data URL前缀如果没有
    const dataUrl = base64.startsWith('data:') 
      ? base64 
      : `data:${mimeType};base64,${base64}`;
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('文件下载失败:', error);
    throw new Error('文件下载失败');
  }
}

/**
 * 检测Base64的文件类型
 */
export function detectBase64FileType(base64: string): { extension: string; mimeType: string } {
  // 检查是否有data URL前缀
  if (base64.startsWith('data:')) {
    const mimeMatch = base64.match(/data:([^;]+)/);
    if (mimeMatch) {
      const mimeType = mimeMatch[1];
      const extension = getExtensionFromMimeType(mimeType);
      return { extension, mimeType };
    }
  }

  // 通过文件头检测 (仅检测常见格式)
  const header = base64.substring(0, 10);
  
  if (header.startsWith('/9j/')) {
    return { extension: 'jpg', mimeType: 'image/jpeg' };
  }
  if (header.startsWith('iVBOR')) {
    return { extension: 'png', mimeType: 'image/png' };
  }
  if (header.startsWith('R0lGO')) {
    return { extension: 'gif', mimeType: 'image/gif' };
  }
  if (header.startsWith('UEsDB')) {
    return { extension: 'zip', mimeType: 'application/zip' };
  }
  if (header.startsWith('JVBER')) {
    return { extension: 'pdf', mimeType: 'application/pdf' };
  }

  // 默认返回
  return { extension: 'bin', mimeType: 'application/octet-stream' };
}

/**
 * 从MIME类型获取文件扩展名
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'text/plain': 'txt',
    'text/html': 'html',
    'text/css': 'css',
    'text/javascript': 'js',
    'application/json': 'json',
    'application/pdf': 'pdf',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'video/mp4': 'mp4',
    'video/avi': 'avi',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
  };

  return mimeToExt[mimeType] || 'bin';
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 验证文件大小限制
 */
export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

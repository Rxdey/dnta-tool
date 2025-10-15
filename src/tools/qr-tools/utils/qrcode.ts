import QRCode from 'qrcode';
import jsQR from 'jsqr';
import type { QRFile } from '../types/index';

/**
 * 将文本分割成块
 */
export function splitTextIntoChunks(text: string, maxBytes: number = 2200): Uint8Array[] {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(text);
  const chunks: Uint8Array[] = [];
  
  for (let i = 0; i < buffer.length; i += maxBytes) {
    chunks.push(buffer.slice(i, i + maxBytes));
  }
  
  return chunks;
}

/**
 * 将 Uint8Array 转换为 base64
 */
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

/**
 * 将 base64 转换为 Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array;
}

/**
 * 生成二维码
 */
export async function generateQRCodes(text: string): Promise<QRFile[]> {
  const chunks = splitTextIntoChunks(text);
  const results: QRFile[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const payload = uint8ArrayToBase64(chunks[i]);
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'L',
      version: 40,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    results.push({
      name: `qr_${String(i + 1).padStart(3, '0')}.png`,
      dataUrl,
    });
  }
  
  return results;
}

/**
 * 从图片中解析二维码
 */
export async function parseQRFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        reject(new Error('无法获取图像数据'));
        return;
      }
      
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        try {
          // 尝试解析为base64
          const uint8Array = base64ToUint8Array(code.data);
          const decoder = new TextDecoder('utf-8');
          resolve(decoder.decode(uint8Array));
        } catch {
          // 如果不是base64，直接返回原始数据
          resolve(code.data);
        }
      } else {
        reject(new Error('未能识别到二维码'));
      }
    };
    
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 下载二维码图片
 */
export function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 批量下载所有二维码
 */
export async function downloadAllQRCodes(qrFiles: QRFile[]) {
  for (const file of qrFiles) {
    downloadQRCode(file.dataUrl, file.name);
    // 添加短暂延迟，避免浏览器阻止多个下载
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

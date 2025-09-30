import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

/**
 * 全局图片预览工具
 */
class ImagePreviewManager {
  private viewer: Viewer | null = null;

  /**
   * 预览单张图片
   * @param imageUrl 图片URL
   * @param title 图片标题（可选）
   */
  preview(imageUrl: string, title?: string) {
    // 创建临时图片元素
    const tempImg = document.createElement('img');
    tempImg.src = imageUrl;
    tempImg.alt = title || 'preview';
    tempImg.style.display = 'none';
    document.body.appendChild(tempImg);

    // 创建 Viewer 实例
    this.viewer = new Viewer(tempImg, {
      inline: false,
      navbar: false,
      title: !!title,
      toolbar: {
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: 0,
        play: 0,
        next: 0,
        rotateLeft: 1,
        rotateRight: 1,
        flipHorizontal: 1,
        flipVertical: 1,
      },
      viewed() {
        // 显示后移除临时元素
        document.body.removeChild(tempImg);
      },
      hidden: () => {
        // 销毁 viewer 实例
        if (this.viewer) {
          this.viewer.destroy();
          this.viewer = null;
        }
      }
    });

    // 显示预览
    this.viewer.show();
  }

  /**
   * 预览图片数组
   * @param images 图片数组 [{ url: string, title?: string }]
   * @param initialIndex 初始显示的图片索引
   */
  previewGallery(images: Array<{ url: string; title?: string }>, initialIndex = 0) {
    // 创建临时容器
    const container = document.createElement('div');
    container.style.display = 'none';
    document.body.appendChild(container);

    images.forEach((img, index) => {
      const imgElement = document.createElement('img');
      imgElement.src = img.url;
      imgElement.alt = img.title || `image-${index}`;
      container.appendChild(imgElement);
    });

    // 创建 Viewer 实例
    this.viewer = new Viewer(container, {
      inline: false,
      navbar: images.length > 1,
      title: true,
      toolbar: {
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: images.length > 1 ? 1 : 0,
        play: images.length > 1 ? 1 : 0,
        next: images.length > 1 ? 1 : 0,
        rotateLeft: 1,
        rotateRight: 1,
        flipHorizontal: 1,
        flipVertical: 1,
      },
      viewed() {
        // 显示后移除临时容器
        document.body.removeChild(container);
      },
      hidden: () => {
        // 销毁 viewer 实例
        if (this.viewer) {
          this.viewer.destroy();
          this.viewer = null;
        }
      }
    });

    // 显示指定索引的图片
    this.viewer.view(initialIndex);
  }

  /**
   * 关闭预览
   */
  close() {
    if (this.viewer) {
      this.viewer.hide();
    }
  }
}

// 导出全局实例
export const imagePreview = new ImagePreviewManager();

/**
 * 预览单张图片的便捷方法
 */
export const previewImage = (imageUrl: string, title?: string) => {
  imagePreview.preview(imageUrl, title);
};

/**
 * 预览图片画廊的便捷方法
 */
export const previewGallery = (images: Array<{ url: string; title?: string }>, initialIndex = 0) => {
  imagePreview.previewGallery(images, initialIndex);
};

export default imagePreview;
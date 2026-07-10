/**
 * `json-viewer` 自定义元素（来自 @_1602/json-viewer，Chrome DevTools 网络面板 JSON 查看器复刻）的 TS 声明。
 * 该库是一个 Web Component（<json-viewer>），无自带类型定义，这里手动扩充 React 19 的 JSX 固有元素类型。
 */
import type * as React from 'react';

// 该库无自带类型声明，声明模块以免 side-effect import 报 TS 错误
declare module '@_1602/json-viewer';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'json-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        /** 待展示的 JSON 字符串（组件内部会 JSON.parse 再渲染），必须为 string */
        value?: string;
        /** 是否默认展开所有节点 */
        expanded?: boolean;
      };
    }
  }
}

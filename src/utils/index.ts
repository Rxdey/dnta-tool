import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** 复制指定文本 */
export const copyToClipboard = (txt = '', cb = () => {}) => {
    const node: HTMLTextAreaElement = document.createElement('textarea');
    node.value = txt;
    document.body.appendChild(node);
    node.select();
    document.execCommand('Copy');
    document.body.removeChild(node);
    cb();
};
/** 下载文件 */
export const downLoadFile = (href = '', fileName = '') => {
    if (!href) return;
    const a = document.createElement('a');
    a.href = href;
    a.download = fileName;
    a.click();
};

/** 多层级合并对象 */
export const mergeObjects = <T extends Record<string, any>>(obj1: T, obj2: T): T => {
    const merged = { ...obj2 };
    for (let key in obj1) {
        if (obj1.hasOwnProperty(key)) {
            if (
                typeof obj1[key] === 'object' &&
                !Array.isArray(obj1[key]) &&
                typeof obj2[key] === 'object' &&
                !Array.isArray(obj2[key])
            ) {
                merged[key] = mergeObjects(obj1[key], obj2[key]);
            } else {
                merged[key] = obj1[key];
            }
        }
    }
    return merged;
};

// 获取链接参数
export const getSearchCode = (name: string) => {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
    var r = window.location.search.substring(1).match(reg);
    return r ? decodeURIComponent(r[2]) : null;
};
/** 随机数 */
export const randomId = (n = 5) => {
    return (~~(Math.random() * (1 << 30))).toString(36);
};

export function convertMillisToTime(millis: number) {
    let seconds = Math.floor(millis / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;
    hours = hours % 24;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const cleanParams = (params: Record<string, any>) => {
    const obj: Record<string, any> = {};
    Object.keys(JSON.parse(JSON.stringify(params))).forEach((d) => {
        if (!!params[d] || params[d] === 0) {
            obj[d] = params[d];
        }
    });
    return obj;
};

// 排列组合
export const combine = (array: any[]) => {
    return array.reduce(
        (a, b) => {
            return a.flatMap((x: any) => b.map((y: any) => [...x, y]));
        },
        [[]]
    );
};
interface TreeNode {
    value: string;
    label: string;
    children?: TreeNode[];
}

interface LabelValuePair {
    value: string;
    label: string;
}
/** 根据值查询对应的对象 */
export function findLabelByValues(values: string[], data: TreeNode[]): LabelValuePair[] | null {
    let currentLevel = data;
    const result: LabelValuePair[] = [];

    for (const value of values) {
        const node = currentLevel.find((item) => item.value === value);

        if (!node) return null;

        result.push({ value: node.value, label: node.label });

        currentLevel = node.children || [];
    }

    return result;
}

export function iframePostMessage(message: string) {
    if (!window.parent) return;
    window.parent.postMessage(
        {
            origin: 'MENG-BOT',
            type: 'product',
            data: message,
        },
        '*'
    );
}

export function timeFromNow(date?: string): string {
    if (!date) return '刚刚';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) {
        return '刚刚';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}分钟前`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}小时前`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}天前`;
    } else if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks}周前`;
    } else if (diffInSeconds < 31536000) {
        const months = Math.floor(diffInSeconds / 2592000);
        return `${months}月前`;
    } else {
        const years = Math.floor(diffInSeconds / 31536000);
        return `${years}年前`;
    }
}

export function extractDomain(url?: string): string {
    if (!url) return '';
    try {
        const { hostname } = new URL(url);
        return hostname;
    } catch (error) {
        console.error('Invalid URL:', error);
        return '';
    }
}

export function findNodeById<T extends Record<string, any>>(tree: T[], id: any, key: keyof T): T | null {
    for (const node of tree) {
        if (node[key] === id) {
            return node;
        }
        if (node['children']) {
            const result = findNodeById(node.children, id, key);
            if (result) {
                return result;
            }
        }
    }
    return null;
}

export function deleteNodeById<T extends Record<string, any>>(tree: T[], id: number | string, key: keyof T) {
    for (let i = 0; i < tree.length; i++) {
        if (tree[i][key] === id) {
            tree.splice(i, 1);
            return;
        }
        if (tree[i]['children']) {
            deleteNodeById(tree[i]['children'], id, key);
        }
    }
}

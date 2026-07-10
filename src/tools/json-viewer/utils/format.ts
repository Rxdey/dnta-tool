/**
 * JSON 查看器工具 - 输入转换与解析工具
 * 纯函数实现，不依赖 React，便于独立测试与复用
 */

/** 安全解析结果 */
export interface ParseResult {
  /** 解析成功时的数据 */
  data?: unknown;
  /** 解析失败时的错误信息 */
  error?: string;
}

/**
 * 安全解析 JSON 字符串，解析失败时返回错误信息而不抛异常
 * @param text 待解析的文本
 */
export const safeParse = (text: string): ParseResult => {
  try {
    const data = JSON.parse(text);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '无效的 JSON' };
  }
};

/**
 * 手动反转义常见转义符（用于非标准 JSON 字符串字面量场景）
 */
const manualUnescape = (text: string): string =>
  text
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f');

/**
 * 格式化 JSON：重新排版为 2 空格缩进。
 * 若输入整体是一个被双引号包裹的 JSON 字符串（如 `"{\"a\":1}"`），
 * 会先解开外层引号并去转义，再解析为对象后格式化。
 * @throws 无法解析为 JSON 时抛出异常
 */
export const formatJson = (text: string): string => {
  const trimmed = text.trim();
  const direct = safeParse(trimmed);
  let data: unknown = direct.data;

  // 解析结果是字符串时，尝试把该字符串再当作 JSON 解析
  // 以处理「带前后引号的 JSON 字符串」这种输入
  if (typeof data === 'string') {
    const inner = safeParse(data);
    if (inner.data !== undefined) {
      data = inner.data;
    }
  }

  if (data === undefined) {
    throw new Error('无法解析为 JSON');
  }
  return JSON.stringify(data, null, 2);
};

/**
 * 去转义：优先当作 JSON 字符串字面量解析（标准去转义）；
 * 失败则手动反转义常见转义符后返回。
 * @throws 输入为空时抛出异常
 */
export const unescapeJson = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('输入为空');
  }
  try {
    const v = JSON.parse(trimmed);
    if (typeof v === 'string') {
      return v;
    }
  } catch {
    // 不是合法的 JSON 字符串字面量，走手动反转义
  }
  return manualUnescape(trimmed);
};

/**
 * 启发式修复「不太标准」的 JSON（best-effort，不保证一定成功）：
 * - 去除 `//` 与 `/* ... *\/` 注释
 * - 单引号替换为双引号
 * - 去除尾随逗号（出现在 `}` 或 `]` 之前）
 * - 给未加引号的 key 补双引号
 */
export const fixJson = (text: string): string => {
  let s = text;
  // 去除块注释
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  // 去除行注释
  s = s.replace(/\/\/.*$/gm, '');
  // 单引号 -> 双引号（简单启发式，不处理已转义的单引号）
  s = s.replace(/'/g, '"');
  // 去除尾随逗号
  s = s.replace(/,(\s*[}\]])/g, '$1');
  // 给未加引号的 key 补双引号
  s = s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3');
  return s;
};

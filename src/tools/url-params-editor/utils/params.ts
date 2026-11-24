/**
 * URL 参数编辑器 - 解析与转换纯函数
 * 不依赖 React，便于独立测试与复用。
 * 核心数据模型为「参数列表 ParamEntry[]」，天然支持重复 key（与 URLSearchParams 语义一致）。
 */

/** 单个查询参数（值均已按 URL 规则解码，人类可读） */
export interface ParamEntry {
  /** 参数名（解码后） */
  key: string;
  /** 参数值（解码后） */
  value: string;
}

/** URL 外壳：参数之外的部分，生成新 URL 时原样拼回 */
export interface UrlShell {
  /** URL 中 ? 之前的部分（协议、主机、路径；纯 query 输入时为空） */
  base: string;
  /** URL 中 # 及其之后的部分（含 #），无哈希时为空 */
  hash: string;
  /** 输入中是否原本带 ? 号：base 为空时决定是否给输出补 ? 前缀 */
  hasQueryMark: boolean;
}

/** URL 解析结果 = 外壳 + 参数列表 */
export interface ParsedUrl extends UrlShell {
  /** 从 query 解析出的参数列表（保持原始顺序与重复项） */
  params: ParamEntry[];
}

/**
 * 解析 URL 或 query 字符串。
 * 支持完整 URL、相对路径、带 ? 或不带 ? 的 query。
 * @param input 用户输入的 URL 文本
 */
export const parseUrl = (input: string): ParsedUrl => {
  const trimmed = input.trim();
  const empty: ParsedUrl = { base: '', hash: '', hasQueryMark: false, params: [] };
  if (!trimmed) return empty;

  // 先分离 hash（# 及其之后），URL 中 hash 恒在 query 之后
  const hashIndex = trimmed.indexOf('#');
  const hash = hashIndex >= 0 ? trimmed.slice(hashIndex) : '';
  const beforeHash = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;

  // 再以第一个 ? 分离 base 与 query
  const queryIndex = beforeHash.indexOf('?');
  const hasQueryMark = queryIndex >= 0;
  const base = hasQueryMark ? beforeHash.slice(0, queryIndex) : beforeHash;
  const query = hasQueryMark ? beforeHash.slice(queryIndex + 1) : beforeHash;

  const params = Array.from(new URLSearchParams(query).entries()).map(([key, value]) => ({
    key,
    value,
  }));

  // 无 ? 且整体不是明显 URL（无协议/路径分隔符）时，视为纯 query，base 应为 ''
  // 例：'a=1&b=2' → base=''；'/api?a=1' → base='/api'
  const looksLikeUrl = /:\/\/|^\/|^https?:|^[a-zA-Z][\w+.-]*:/.test(base);
  const effectiveBase = !hasQueryMark && !looksLikeUrl && query === base ? '' : base;

  return { base: effectiveBase, hash, hasQueryMark, params };
};

/**
 * 依据外壳与参数列表生成新的 URL / query 字符串。
 * 参数值由 URLSearchParams 负责百分号编码（空格→+、中文→%XX 等）。
 * @param shell URL 外壳（base/hash/是否有 ?）
 * @param params 参数列表
 */
export const buildUrl = (shell: UrlShell, params: ParamEntry[]): string => {
  const search = new URLSearchParams();
  params.forEach(({ key, value }) => search.append(key, value));
  const query = search.toString();

  if (!query) return `${shell.base}${shell.hash}`;
  // base 为空（纯参数输入）时，按输入是否带 ? 决定是否补前缀
  const prefix = shell.base ? '?' : shell.hasQueryMark ? '?' : '';
  return `${shell.base}${prefix}${query}${shell.hash}`;
};

/**
 * 参数列表 → 对象形式的 JSON 字符串。
 * 重复 key 合并为字符串数组；值统一保留为字符串，贴合 query 语义。
 * @param params 参数列表
 */
export const paramsToJson = (params: ParamEntry[]): string => {
  const record: Record<string, string | string[]> = {};
  params.forEach(({ key, value }) => {
    const existing = record[key];
    if (existing === undefined) {
      record[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      record[key] = [existing, value];
    }
  });
  return JSON.stringify(record, null, 2);
};

/**
 * 对象形式的 JSON → 参数列表（支持字符串/数字/布尔/数组值，不支持嵌套对象）。
 * @param json JSON 文本
 * @throws JSON 非法或含不支持的嵌套对象时抛出异常
 */
export const jsonToParams = (json: string): ParamEntry[] => {
  const data: unknown = JSON.parse(json);
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('JSON 顶层必须是对象');
  }

  const toValue = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') throw new Error('不支持嵌套对象，参数值只能是字符串/数字/布尔或其数组');
    return String(v);
  };

  const result: ParamEntry[] = [];
  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => result.push({ key, value: toValue(item) }));
    } else {
      result.push({ key, value: toValue(value) });
    }
  });
  return result;
};

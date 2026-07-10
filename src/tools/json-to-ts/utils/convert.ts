import type { ConvertOptions, ConvertedResult, GeneratedType, TypeField } from '../types';

// 默认配置
const defaultOptions: ConvertOptions = {
	nullAsOptional: false,
	allOptional: false,
	useInterface: false,
};

/**
 * path 分段转 PascalCase（下划线连接的多单词合并）
 */
const toPascal = (segment: string): string => {
	const words = segment.split(/[_\-\s]+/);
	return words
		.map(w => w.charAt(0).toUpperCase() + w.slice(1))
		.join('');
};

/**
 * JSON path → 类型名
 * Root 作为特殊处理，其余段拼接去掉 Root 前缀
 */
const pathToTypeName = (path: string[]): string => {
	if (!path.length) return 'Root';
	// 去掉 'Root' 前缀，保持类型名简洁
	const segments = path[0] === 'Root' ? path.slice(1) : path;
	if (!segments.length) return 'Root';
	return segments.map(toPascal).join('');
};

/**
 * 比较两个值的结构特征（用于数组项去重）
 */
const getStructuralSignature = (value: unknown): string => {
	if (value === null || value === undefined) return typeof value;
	if (Array.isArray(value)) {
		return `array[${value.map(getStructuralSignature).join(',')}]`;
	}
	if (typeof value !== 'object') return typeof value;
	const keys = Object.keys(value).sort();
	const sig = keys.map(k => `${k}:${getStructuralSignature((value as Record<string, unknown>)[k])}`).join(',');
	return `object{${sig}}`;
};

/**
 * 主转换函数
 */
export function convert(jsonString: string, options?: Partial<ConvertOptions>): ConvertedResult {
	const opts = { ...defaultOptions, ...options };

	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonString);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { types: [], rootName: 'Root', error: `JSON 解析失败: ${msg}` };
	}

	const types: GeneratedType[] = [];
	const typeCache = new Map<string, string>();

	// 递归转换，返回类型引用名
	const processValue = (value: unknown, path: string[]): string => {
		// undefined 在 JSON 中不存在（会被忽略），这里处理 null
		if (value === null) {
			if (opts.nullAsOptional) {
				return 'any'; // 调用方会标记为可选
			}
			return 'any';
		}

		if (Array.isArray(value)) {
			// 空数组
			if (value.length === 0) return 'any[]';

			// 按结构特征分组去重
			const groups = new Map<string, unknown[]>();
			for (const item of value) {
				const sig = getStructuralSignature(item);
				if (!groups.has(sig)) groups.set(sig, []);
				groups.get(sig)!.push(item);
			}

			// 如果只有一个类型，直接处理第一个元素
			if (groups.size === 1) {
				const groupItems = groups.values().next().value;
				const innerType = processValue(groupItems[0], [...path, 'Item']);
				return `${innerType}[]`;
			}

			// 多个类型，生成联合
			const unionTypes: string[] = [];
			for (const items of groups.values()) {
				const innerType = processValue(items[0], [...path, 'Item']);
				unionTypes.push(innerType);
			}
			return `(${unionTypes.join(' | ')})[]`;
		}

		if (typeof value === 'object') {
			// 已处理数组，这里就是普通对象
			const obj = value as Record<string, unknown>;

			// 空对象
			if (Object.keys(obj).length === 0) return 'Record<string, any>';

			const typeName = pathToTypeName(path);
			// 如果此类型已生成过，直接返回引用
			if (typeCache.has(typeName)) return typeCache.get(typeName)!;

			const fields: TypeField[] = [];
			for (const [key, val] of Object.entries(obj)) {
				let tsType = processValue(val, [...path, key]);
				let optional = opts.allOptional;

				// null 值作为可选
				if (val === null && opts.nullAsOptional) {
					optional = true;
				}

				fields.push({
					name: key,
					tsType,
					optional,
				});
			}

			typeCache.set(typeName, typeName);
			types.push({ name: typeName, fields });
			return typeName;
		}

		// 基本类型
		return typeof value;
	};

	// 入口，根路径为 ['Root']
	const rootName = processValue(parsed, ['Root']);

	// 确保 Root 在最前面
	const sortedTypes = types.sort((a, b) => {
		if (a.name === 'Root') return -1;
		if (b.name === 'Root') return 1;
		return 0;
	});

	return { types: sortedTypes, rootName: rootName };
}

/**
 * 将转换结果渲染为 TypeScript 代码字符串
 */
export function renderTypes(result: ConvertedResult, options: ConvertOptions = defaultOptions): string {
	if (result.error) return '';
	if (!result.types.length) return '';

	const keyword = options.useInterface ? 'interface' : 'type';
	const lines: string[] = [];

	for (const t of result.types) {
		if (options.useInterface) {
			lines.push(`${keyword} ${t.name} {`);
			for (const f of t.fields) {
				const opt = f.optional ? '?' : '';
				lines.push(`  ${f.name}${opt}: ${f.tsType};`);
			}
			lines.push('}');
		} else {
			const fieldsStr = t.fields.map(f => {
				const opt = f.optional ? '?' : '';
				return `  ${f.name}${opt}: ${f.tsType};`;
			}).join('\n');
			lines.push(`${keyword} ${t.name} = {`);
			lines.push(fieldsStr);
			lines.push('};');
		}
		lines.push('');
	}

	return lines.join('\n').trim();
}

// any 类型可替换成的目标类型（下拉四选一）
export type AnyType = 'any' | 'string' | 'number' | 'string | number';

// 转换配置选项
export interface ConvertOptions {
	// null 值作为可选属性 (any?)
	nullAsOptional: boolean;
	// 所有字段都标记为可选
	allOptional: boolean;
	// 使用 interface 替代 type
	useInterface: boolean;
	// 推断为 any 的类型替换成什么（默认 any，保持原行为）
	anyType: AnyType;
}

// 生成的类型字段
export interface TypeField {
	name: string;
	tsType: string;
	optional: boolean;
}

// 单个生成的类型声明
export interface GeneratedType {
	name: string;
	fields: TypeField[];
}

// 转换结果
export interface ConvertedResult {
	types: GeneratedType[];
	rootName: string;
	error?: string;
}

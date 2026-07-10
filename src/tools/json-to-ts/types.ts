// 转换配置选项
export interface ConvertOptions {
	// null 值作为可选属性 (any?)
	nullAsOptional: boolean;
	// 所有字段都标记为可选
	allOptional: boolean;
	// 使用 interface 替代 type
	useInterface: boolean;
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

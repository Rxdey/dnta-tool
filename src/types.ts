export type ActiveData<T extends Record<string, any> = Record<string, any>> = {
    data: T;
    clickPosition?: { x: number; y: number };
};

import { Expression } from './expression.js';
export class Context {
    /**
     * Merges multiple context layers sequentially.
     * Priority goes from left to right (rightmost layer overrides leftmost layer).
     */
    static merge(layers, env) {
        const merged = {};
        for (const layer of layers) {
            if (!layer)
                continue;
            if (typeof layer === 'string') {
                const trimmed = layer.trim();
                if (trimmed === '')
                    continue;
                try {
                    const ast = Expression.parse(trimmed);
                    const evaluated = Expression.evaluate(ast, env);
                    if (evaluated && typeof evaluated === 'object') {
                        Object.assign(merged, evaluated);
                    }
                }
                catch (e) {
                    console.warn(`Failed to parse or evaluate context expression: "${trimmed}"`, e);
                }
            }
            else if (typeof layer === 'object') {
                Object.assign(merged, layer);
            }
        }
        return merged;
    }
}
//# sourceMappingURL=context.js.map
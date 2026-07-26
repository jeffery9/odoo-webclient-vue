import { ExprNode } from './ast.js';
export declare class Expression {
    static parse(expr: string): ExprNode;
    static evaluate(node: ExprNode, env: Record<string, any>): any;
    private static tokenize;
}
//# sourceMappingURL=expression.d.ts.map
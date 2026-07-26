/**
 * Odoo Expression AST node definitions.
 * Represents parsed Python-like expression segments.
 */
export type ExprNode = {
    type: 'literal';
    value: any;
} | {
    type: 'identifier';
    name: string;
} | {
    type: 'binary';
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=';
    left: ExprNode;
    right: ExprNode;
} | {
    type: 'dictionary';
    properties: Record<string, ExprNode>;
} | {
    type: 'logical';
    operator: 'and' | 'or';
    left: ExprNode;
    right: ExprNode;
} | {
    type: 'unary';
    operator: 'not';
    operand: ExprNode;
} | {
    type: 'array';
    elements: ExprNode[];
};
//# sourceMappingURL=ast.d.ts.map
/**
 * Odoo Domain DSL Abstract Syntax Tree (AST) definitions.
 */
export type DomainOperator = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not in' | 'like' | 'ilike' | '=like' | '=ilike' | 'child_of' | 'parent_of';
export type DomainLeaf = [string, DomainOperator, any];
export type DomainLogicalOperator = '&' | '|' | '!';
export interface DomainLogicalNode {
    operator: DomainLogicalOperator;
    operands: DomainNode[];
}
export type DomainNode = DomainLeaf | DomainLogicalNode;
//# sourceMappingURL=ast.d.ts.map
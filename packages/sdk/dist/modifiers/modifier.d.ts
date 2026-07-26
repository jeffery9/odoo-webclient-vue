import { DomainNode } from '../domain/ast.js';
export interface CompiledModifiers {
    invisible?: boolean | DomainNode;
    readonly?: boolean | DomainNode;
    required?: boolean | DomainNode;
}
export interface ModifierSpec {
    attrs?: string | Record<string, any>;
    readonly?: string | boolean;
    invisible?: string | boolean;
    required?: string | boolean;
    states?: string;
}
export declare class Modifier {
    static compile(spec: ModifierSpec): CompiledModifiers;
    private static parseStaticShortcut;
    static evaluate(compiled: CompiledModifiers, record: Record<string, any>, env: Record<string, any>): Record<string, boolean>;
    private static evaluateCondition;
}
//# sourceMappingURL=modifier.d.ts.map
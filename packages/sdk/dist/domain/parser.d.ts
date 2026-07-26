import { DomainNode } from './ast.js';
export declare class Domain {
    static parse(domain: any[]): DomainNode;
    static normalize(node: DomainNode): DomainNode;
    static toRPC(node: DomainNode): any[];
    static evaluate(node: DomainNode, record: Record<string, any>): boolean;
}
//# sourceMappingURL=parser.d.ts.map
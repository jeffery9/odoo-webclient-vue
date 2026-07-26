import { DomainNode, DomainLogicalOperator } from './ast.js';

export class Domain {
  static parse(domain: any[]): DomainNode {
    if (!Array.isArray(domain) || domain.length === 0) {
      return { operator: '&', operands: [] };
    }

    const stack: DomainNode[] = [];

    for (let i = domain.length - 1; i >= 0; i--) {
      const term = domain[i];

      if (term === '&' || term === '|' || term === '!') {
        const op = term as DomainLogicalOperator;
        if (op === '!') {
          const operand = stack.pop();
          if (!operand) {
            throw new Error(`Invalid domain: '!' operator lacks operand`);
          }
          stack.push({ operator: '!', operands: [operand] });
        } else {
          const left = stack.pop();
          const right = stack.pop();
          if (!left || !right) {
            throw new Error(`Invalid domain: '${op}' operator lacks operands`);
          }
          stack.push({ operator: op, operands: [left, right] });
        }
      } else if (Array.isArray(term)) {
        stack.push(term as any);
      } else {
        throw new Error(`Invalid term in domain: ${term}`);
      }
    }

    if (stack.length === 0) {
      return { operator: '&', operands: [] };
    }

    if (stack.length === 1) {
      return stack[0];
    }

    return {
      operator: '&',
      operands: stack.reverse()
    };
  }

  static normalize(node: DomainNode): DomainNode {
    if (Array.isArray(node)) {
      return node;
    }

    const normalizedOperands = node.operands.map(op => this.normalize(op));

    if ((node.operator === '&' || node.operator === '|') && normalizedOperands.length === 1) {
      return normalizedOperands[0];
    }

    return {
      operator: node.operator,
      operands: normalizedOperands
    };
  }

  static toRPC(node: DomainNode): any[] {
    if (Array.isArray(node)) {
      return [node];
    }

    if (node.operator === '!') {
      return ['!', ...this.toRPC(node.operands[0])];
    }

    const serialized: any[] = [];
    serialized.push(node.operator);
    serialized.push(...this.toRPC(node.operands[0]));
    serialized.push(...this.toRPC(node.operands[1]));

    return serialized;
  }

  static evaluate(node: DomainNode, record: Record<string, any>): boolean {
    if (Array.isArray(node)) {
      const [field, op, val] = node;
      const recordVal = record[field];

      switch (op) {
        case '=':
        case '==':
          return recordVal === val;
        case '!=':
          return recordVal !== val;
        case '>':
          return recordVal > val;
        case '>=':
          return recordVal >= val;
        case '<':
          return recordVal < val;
        case '<=':
          return recordVal <= val;
        case 'in':
          return Array.isArray(val) ? val.includes(recordVal) : false;
        case 'not in':
          return Array.isArray(val) ? !val.includes(recordVal) : true;
        case 'like':
          if (typeof recordVal === 'string' && typeof val === 'string') {
            return recordVal.includes(val);
          }
          return false;
        case 'ilike':
          if (typeof recordVal === 'string' && typeof val === 'string') {
            return recordVal.toLowerCase().includes(val.toLowerCase());
          }
          return false;
        default:
          return recordVal === val;
      }
    }

    if (node.operator === '&') {
      return node.operands.every(op => this.evaluate(op, record));
    }

    if (node.operator === '|') {
      return node.operands.some(op => this.evaluate(op, record));
    }

    if (node.operator === '!') {
      return !this.evaluate(node.operands[0], record);
    }

    return false;
  }
}

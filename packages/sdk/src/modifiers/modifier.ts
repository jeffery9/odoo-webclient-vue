import { DomainNode } from '../domain/ast.js';
import { Domain } from '../domain/parser.js';
import { Expression } from '../context/expression.js';

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

export class Modifier {
  static compile(spec: ModifierSpec): CompiledModifiers {
    const compiled: CompiledModifiers = {};

    if (spec.invisible !== undefined) {
      compiled.invisible = this.parseStaticShortcut(spec.invisible);
    }
    if (spec.readonly !== undefined) {
      compiled.readonly = this.parseStaticShortcut(spec.readonly);
    }
    if (spec.required !== undefined) {
      compiled.required = this.parseStaticShortcut(spec.required);
    }

    if (spec.states) {
      const allowedStates = spec.states.split(',').map(s => s.trim());
      const domainNode = ['state', 'not in', allowedStates] as any;

      if (compiled.invisible === undefined || compiled.invisible === false) {
        compiled.invisible = domainNode;
      } else if (compiled.invisible === true) {
        // already always invisible
      } else {
        compiled.invisible = {
          operator: '|',
          operands: [compiled.invisible, domainNode]
        };
      }
    }

    if (spec.attrs) {
      let attrsObj: Record<string, any> = {};
      if (typeof spec.attrs === 'string') {
        const trimmed = spec.attrs.trim();
        if (trimmed) {
          try {
            const exprAst = Expression.parse(trimmed);
            attrsObj = Expression.evaluate(exprAst, {});
          } catch (e) {
            console.warn(`Failed to parse attrs expression: "${trimmed}"`, e);
          }
        }
      } else if (typeof spec.attrs === 'object') {
        attrsObj = spec.attrs;
      }

      for (const [mod, domain] of Object.entries(attrsObj)) {
        if (mod === 'invisible' || mod === 'readonly' || mod === 'required') {
          const modType = mod as 'invisible' | 'readonly' | 'required';
          if (Array.isArray(domain)) {
            const parsedDomain = Domain.parse(domain);
            const existing = compiled[modType];
            if (existing === undefined || existing === false) {
              compiled[modType] = parsedDomain;
            } else if (existing === true) {
              // statically true overrides
            } else {
              compiled[modType] = {
                operator: '|',
                operands: [existing, parsedDomain]
              };
            }
          } else if (typeof domain === 'boolean') {
            compiled[modType] = domain;
          }
        }
      }
    }

    return compiled;
  }

  private static parseStaticShortcut(val: any): boolean {
    if (typeof val === 'boolean') return val;
    const s = String(val).trim();
    return s === '1' || s === 'true' || s === 'True';
  }

  static evaluate(
    compiled: CompiledModifiers,
    record: Record<string, any>,
    env: Record<string, any>
  ): Record<string, boolean> {
    return {
      invisible: this.evaluateCondition(compiled.invisible, record, env),
      readonly: this.evaluateCondition(compiled.readonly, record, env),
      required: this.evaluateCondition(compiled.required, record, env)
    };
  }

  private static evaluateCondition(
    condition: boolean | DomainNode | undefined,
    record: Record<string, any>,
    env: Record<string, any>
  ): boolean {
    if (condition === undefined) return false;
    if (typeof condition === 'boolean') return condition;

    try {
      return Domain.evaluate(condition, record);
    } catch (e) {
      console.warn('Failed to evaluate modifier domain condition against record', e);
      return false;
    }
  }
}

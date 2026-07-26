import { XMLParser } from 'fast-xml-parser';
import { Modifier } from '../modifiers/modifier.js';

export class ArchCompiler {
  static compile(xml: string): any {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      allowBooleanAttributes: true,
      preserveOrder: true
    });

    const parsed = parser.parse(xml.trim());
    if (!parsed || parsed.length === 0) {
      throw new Error('Invalid XML view definition');
    }

    const rootObj = parsed.find((node: any) => {
      const keys = Object.keys(node);
      return keys.length > 0 && !keys.includes('#text');
    });

    if (!rootObj) {
      throw new Error('No root tag found in view definition');
    }

    const rootTag = Object.keys(rootObj).find(k => k !== ':@')!;
    return this.transformNode(rootTag, rootObj[rootTag], rootObj[':@']);
  }

  private static transformNode(tag: string, children: any[], rawAttrs: Record<string, any> = {}): any {
    const attrs: Record<string, string> = {};

    for (const [key, val] of Object.entries(rawAttrs)) {
      attrs[key] = String(val);
    }

    const node: any = {
      tag,
      attrs
    };

    if (['field', 'button', 'group', 'label', 'separator', 'list', 'tree', 'form'].includes(tag)) {
      node.modifiers = Modifier.compile(attrs as any);
    }

    if (tag === 't') {
      for (const [key, val] of Object.entries(attrs)) {
        if (key === 't-if') {
          node.type = 'if';
          node.expr = val;
        } else if (key === 't-foreach') {
          node.type = 'foreach';
          node.expr = val;
        } else if (key === 't-as') {
          node.as = val;
        }
      }
    }

    if (Array.isArray(children) && children.length > 0) {
      const mappedChildren: any[] = [];

      for (const childObj of children) {
        const childKeys = Object.keys(childObj);
        const childTag = childKeys.find(k => k !== ':@' && k !== '#text');

        if (childTag) {
          const childNode = this.transformNode(childTag, childObj[childTag], childObj[':@']);
          mappedChildren.push(childNode);
        }
      }

      if (mappedChildren.length > 0) {
        node.children = mappedChildren;
      }
    }

    return node;
  }
}

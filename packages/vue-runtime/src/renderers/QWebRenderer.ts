import { defineComponent, h } from 'vue';
import { Expression } from '@odoo/sdk';

export const QWebRenderer = defineComponent({
  props: {
    arch: { type: Object, required: true },
    context: { type: Object, required: true }
  },
  setup(props) {
    const renderNode = (node: any, qwebCtx: any): any => {
      if (!node) return null;

      if (node.tag === 't') {
        if (node.type === 'if') {
          const ast = Expression.parse(node.expr);
          const val = Expression.evaluate(ast, qwebCtx);
          if (val) {
            return (node.children || []).map((c: any) => renderNode(c, qwebCtx));
          }
          return null;
        } else if (node.type === 'foreach') {
          const ast = Expression.parse(node.expr);
          const val = Expression.evaluate(ast, qwebCtx);
          const asVar = node.as || 'item';

          if (Array.isArray(val)) {
            return val.map((item: any) => {
              const loopCtx = { ...qwebCtx, [asVar]: item };
              return (node.children || []).map((c: any) => renderNode(c, loopCtx));
            });
          }
          return null;
        } else if (node.attrs && node.attrs['t-esc']) {
          const ast = Expression.parse(node.attrs['t-esc']);
          const val = Expression.evaluate(ast, qwebCtx);
          return h('span', String(val ?? ''));
        } else {
          return (node.children || []).map((c: any) => renderNode(c, qwebCtx));
        }
      }

      let children: any[] = [];
      let textContent: string | null = null;
      const tagAttrs: any = { ...node.attrs };

      if (node.attrs && node.attrs['t-esc']) {
        const ast = Expression.parse(node.attrs['t-esc']);
        const val = Expression.evaluate(ast, qwebCtx);
        textContent = String(val ?? '');
        delete tagAttrs['t-esc'];
      }

      if (node.children) {
        children = node.children.map((c: any) => renderNode(c, qwebCtx));
      }

      if (textContent !== null) {
        return h(node.tag, tagAttrs, textContent);
      }
      return h(node.tag, tagAttrs, children);
    };

    return () => {
      return h('div', { class: 'o_qweb_view' }, [
        renderNode(props.arch, props.context)
      ]);
    };
  }
});

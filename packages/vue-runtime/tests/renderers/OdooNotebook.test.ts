import { describe, test, expect, vi } from 'vitest';
import { OdooNotebook } from '../../src/renderers/index.js';
import { h } from 'vue';

describe('OdooNotebook', () => {
  test('should render tab headers and lazy-render the active page content', () => {
    const notebookNode = {
      tag: 'notebook',
      children: [
        { tag: 'page', attrs: { string: 'First Page' }, children: [] },
        { tag: 'page', attrs: { string: 'Second Page' }, children: [] }
      ]
    };

    const renderNodeMock = vi.fn((pageNode) => {
      return h('div', { id: `rendered-${pageNode.attrs.string}` }, pageNode.attrs.string);
    });

    const notebookInstance = OdooNotebook as any;
    const renderFn = notebookInstance.setup({ node: notebookNode, renderNode: renderNodeMock }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_notebook');

    const headersUl = vnode.children[0];
    expect(headersUl.type).toBe('ul');
    expect(headersUl.props.class).toBe('o_notebook_headers');
    expect(headersUl.children.length).toBe(2);

    // Active page content container
    const contentDiv = vnode.children[1];
    expect(contentDiv.type).toBe('div');
    expect(contentDiv.props.class).toBe('o_notebook_content');

    // Inside content: only first page should be rendered on initial render
    const activeContent = contentDiv.children;
    const firstPageNode = Array.isArray(activeContent) ? activeContent[0] : activeContent;
    expect(firstPageNode.props.id).toBe('rendered-First Page');
    expect(renderNodeMock).toHaveBeenCalledTimes(1);

    // Simulate clicking on the second tab header (which changes activeIndex to 1)
    const secondHeaderLi = headersUl.children[1];
    secondHeaderLi.props.onClick();

    const secondVnode = renderFn();
    const secondContentDiv = secondVnode.children[1];
    const secondContent = secondContentDiv.children;
    const secondPageNode = Array.isArray(secondContent) ? secondContent[0] : secondContent;
    expect(secondPageNode.props.id).toBe('rendered-Second Page');
    expect(renderNodeMock).toHaveBeenCalledTimes(2);
  });
});

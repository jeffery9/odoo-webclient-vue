import { describe, test, expect } from 'vitest';
import { QWebRenderer } from '../../src/renderers/index.js';

describe('Odoo QWeb Renderer Integration', () => {
  test('should render basic elements and evaluate conditional t-if', () => {
    const arch = {
      tag: 'div',
      attrs: { class: 'container' },
      children: [
        {
          tag: 't',
          type: 'if',
          expr: "state == 'done'",
          children: [
            { tag: 'span', attrs: { class: 'success-badge' } }
          ]
        },
        {
          tag: 't',
          type: 'if',
          expr: "state == 'draft'",
          children: [
            { tag: 'span', attrs: { class: 'draft-badge' } }
          ]
        }
      ]
    };

    const context = { state: 'done' };
    const qwebInstance = QWebRenderer as any;
    const renderFn = qwebInstance.setup({ arch, context }, {});
    const vnode = renderFn();

    // vnode -> outer div class='o_qweb_view' -> inner div class='container'
    const container = vnode.children[0];
    expect(container.type).toBe('div');
    expect(container.props.class).toBe('container');

    // Only state == 'done' is rendered
    expect(container.children.length).toBe(2);
    // index 0 contains the children of 'done' branch spans
    const doneBranch = container.children[0];
    expect(doneBranch[0].type).toBe('span');
    expect(doneBranch[0].props.class).toBe('success-badge');

    // index 1 is draft branch which is null/empty
    expect(container.children[1]).toBeNull();
  });

  test('should render dynamic loops and text interpolation using t-foreach and t-esc', () => {
    const arch = {
      tag: 'ul',
      attrs: { class: 'items-list' },
      children: [
        {
          tag: 't',
          type: 'foreach',
          expr: 'items',
          as: 'row',
          children: [
            {
              tag: 'li',
              attrs: { class: 'item' },
              children: [
                {
                  tag: 'span',
                  attrs: { 't-esc': 'row' }
                }
              ]
            }
          ]
        }
      ]
    };

    const context = { items: ['Apples', 'Bananas', 'Cherries'] };
    const qwebInstance = QWebRenderer as any;
    const renderFn = qwebInstance.setup({ arch, context }, {});
    const vnode = renderFn();

    const list = vnode.children[0];
    expect(list.type).toBe('ul');

    const loopOutput = list.children[0]; // array of evaluated items
    expect(loopOutput.length).toBe(3);

    // Apple row
    const appleRow = loopOutput[0][0]; // nested due to child array
    expect(appleRow.type).toBe('li');
    expect(appleRow.children[0].type).toBe('span');
    expect(appleRow.children[0].children).toBe('Apples');

    // Banana row
    const bananaRow = loopOutput[1][0];
    expect(bananaRow.type).toBe('li');
    expect(bananaRow.children[0].type).toBe('span');
    expect(bananaRow.children[0].children).toBe('Bananas');
  });
});

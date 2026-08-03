import { describe, test, expect } from 'vitest';
import { GraphRenderer } from '../../../src/renderers/index.js';
import { RecordProxy } from '@odoo/sdk';

describe('GraphRenderer', () => {
  const records = [
    new RecordProxy('res.partner', { id: 1, name: 'Alice' }),
    new RecordProxy('res.partner', { id: 2, name: 'Bob' }),
    new RecordProxy('res.partner', { id: 3, name: 'Alice' })
  ];

  test('should render bar chart by default', () => {
    const arch = {
      tag: 'graph',
      attrs: { string: 'Partner Analysis' },
      children: [
        { tag: 'field', attrs: { name: 'name', type: 'row' } }
      ]
    };

    const graphInstance = GraphRenderer as any;
    const renderFn = graphInstance.setup({ arch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_graph_view');
    
    // Header
    const h3 = vnode.children[0];
    expect(h3.type).toBe('h3');
    expect(h3.children).toBe('Partner Analysis');

    // SVG
    const svg = vnode.children[1];
    expect(svg.type).toBe('svg');
    
    // There are 2 bars: Alice (2 occurrences) and Bob (1 occurrence)
    const bars = svg.children;
    expect(bars.length).toBe(2);
    
    // Check first bar (Alice)
    const firstGroup = bars[0];
    const firstTextLabel = firstGroup.children[1];
    const firstTextVal = firstGroup.children[2];
    expect(firstTextLabel.children).toBe('Alice');
    expect(firstTextVal.children).toBe('2');

    // Check second bar (Bob)
    const secondGroup = bars[1];
    const secondTextLabel = secondGroup.children[1];
    const secondTextVal = secondGroup.children[2];
    expect(secondTextLabel.children).toBe('Bob');
    expect(secondTextVal.children).toBe('1');
  });

  test('should render pie chart when type is pie', () => {
    const arch = {
      tag: 'graph',
      attrs: { string: 'Partner Pie', type: 'pie' },
      children: [
        { tag: 'field', attrs: { name: 'name', type: 'row' } }
      ]
    };

    const graphInstance = GraphRenderer as any;
    const renderFn = graphInstance.setup({ arch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_graph_view');

    // Contains svg and legend div
    const svg = vnode.children[0];
    const legendDiv = vnode.children[1];
    
    expect(svg.type).toBe('svg');
    // 2 slices
    expect(svg.children.length).toBe(2);
    expect(svg.children[0].type).toBe('path');

    expect(legendDiv.type).toBe('div');
    expect(legendDiv.children.length).toBe(2);
    expect(legendDiv.children[0].children[1].children).toBe('Alice (2)');
    expect(legendDiv.children[1].children[1].children).toBe('Bob (1)');
  });

  test('should render line chart when type is line', () => {
    const arch = {
      tag: 'graph',
      attrs: { string: 'Partner Line', type: 'line' },
      children: [
        { tag: 'field', attrs: { name: 'name', type: 'row' } }
      ]
    };

    const graphInstance = GraphRenderer as any;
    const renderFn = graphInstance.setup({ arch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_graph_view');

    const h3 = vnode.children[0];
    expect(h3.children).toBe('Partner Line');

    const svg = vnode.children[1];
    expect(svg.type).toBe('svg');

    // Children: gridLines (5), path (1), circles (2), x-labels (2), y-values (2)
    // 5 + 1 + 2 + 2 + 2 = 12 children in svg
    expect(svg.children.length).toBe(12);

    // Path element
    const path = svg.children[5];
    expect(path.type).toBe('path');
    expect(path.props.stroke).toBe('#714B67');
  });
});

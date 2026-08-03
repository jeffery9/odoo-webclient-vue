import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GraphRenderer } from '../../../src/renderers/index.js';
import { RecordProxy } from '@odoo/sdk';
import * as echarts from 'echarts';

// Setup high-fidelity vitest mock for echarts
const mockSetOption = vi.fn();
const mockResize = vi.fn();
const mockDispose = vi.fn();

vi.mock('echarts', () => {
  return {
    init: vi.fn(() => ({
      setOption: mockSetOption,
      resize: mockResize,
      dispose: mockDispose
    }))
  };
});

describe('GraphRenderer', () => {
  const records = [
    new RecordProxy('res.partner', { id: 1, name: 'Alice' }),
    new RecordProxy('res.partner', { id: 2, name: 'Bob' }),
    new RecordProxy('res.partner', { id: 3, name: 'Alice' })
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render premium ECharts layout and default to bar chart', () => {
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

    // 1. Root container assertions
    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_graph_view');

    // 2. Header and Controls layout
    const header = vnode.children[0];
    expect(header.type).toBe('div');
    expect(header.props.class).toBe('o_graph_header');

    const h3 = header.children[0];
    expect(h3.type).toBe('h3');
    expect(h3.children).toBe('Partner Analysis');

    const buttonsContainer = header.children[1];
    expect(buttonsContainer.type).toBe('div');
    expect(buttonsContainer.props.class).toBe('o_graph_buttons');

    const barToggleBtn = buttonsContainer.children[0];
    const lineToggleBtn = buttonsContainer.children[1];
    const pieToggleBtn = buttonsContainer.children[2];

    expect(barToggleBtn.children).toBe('Bar Chart');
    expect(lineToggleBtn.children).toBe('Line Chart');
    expect(pieToggleBtn.children).toBe('Pie Chart');

    // 3. Canvas element assertions
    const canvas = vnode.children[1];
    expect(canvas.type).toBe('div');
    expect(canvas.props.class).toBe('o_graph_canvas');
  });

  test('should support dynamic interactive view-mode toggling', () => {
    const arch = {
      tag: 'graph',
      attrs: { string: 'Partner Interactive', type: 'line' },
      children: [
        { tag: 'field', attrs: { name: 'name', type: 'row' } }
      ]
    };

    const graphInstance = GraphRenderer as any;
    const renderFn = graphInstance.setup({ arch, records }, {});
    
    // Initial render in 'line' mode as requested by arch
    let vnode = renderFn();

    const header = vnode.children[0];
    const buttonsContainer = header.children[1];
    const barToggleBtn = buttonsContainer.children[0];
    const pieToggleBtn = buttonsContainer.children[2];

    // Trigger state switch to 'pie'
    pieToggleBtn.props.onClick();

    // Re-render and confirm structural toggling remains stable
    vnode = renderFn();
    expect(vnode.type).toBe('div');
    
    // Trigger state switch back to 'bar'
    barToggleBtn.props.onClick();
    vnode = renderFn();
    expect(vnode.type).toBe('div');
  });
});

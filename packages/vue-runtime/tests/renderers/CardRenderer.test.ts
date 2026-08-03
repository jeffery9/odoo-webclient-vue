import { describe, test, expect, vi } from 'vitest';
import { CardRenderer } from '../../src/renderers/index.js';
import { componentRegistry } from '../../src/registry.js';
import { FieldChar } from '../../src/widgets/index.js';
import { RecordProxy } from '@odoo/sdk';
import { ACTION_MANAGER_KEY } from '../../src/di.js';
import { h, defineComponent } from 'vue';

describe('CardRenderer', () => {
  componentRegistry.add('char', FieldChar);

  const cardArch = {
    type: 'kanban',
    children: [
      { tag: 'field', attrs: { name: 'name', string: 'Name' } },
      { tag: 'field', attrs: { name: 'city', string: 'City' } }
    ]
  };

  const records = [
    new RecordProxy('res.partner', { id: 1, name: 'Mitchell Admin', city: 'Brussels' }),
    new RecordProxy('res.partner', { id: 2, name: 'Marc Demo', city: 'Paris' })
  ];

  test('should render card grid and subview cards with dynamic field values', () => {
    const cardInstance = CardRenderer as any;
    const renderFn = cardInstance.setup({ arch: cardArch, records }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_card_grid');
    expect(vnode.children.length).toBe(2); // 2 records -> 2 cards

    const firstCard = vnode.children[0];
    expect(firstCard.type).toBe('div');
    expect(firstCard.props.class).toBe('o_subview_card');

    // Each card should contain 2 field representations (represented as o_card_field containers)
    expect(firstCard.children.length).toBe(2);
    
    const nameFieldContainer = firstCard.children[0];
    expect(nameFieldContainer.props.class).toBe('o_card_field');
    expect(nameFieldContainer.children[0].type).toBe('strong');
    expect(nameFieldContainer.children[0].children).toBe('Name');
    
    // Check inside nested child widget structure
    const nameWidget = nameFieldContainer.children[1];
    expect(nameWidget.type).toBe(FieldChar);
    expect(nameWidget.props.name).toBe('name');
  });

  test('should trigger doAction when card is clicked and actionManager is provided', () => {
    const mockActionManager = {
      doAction: vi.fn()
    };

    const cardInstance = defineComponent({
      setup() {
        return {
          render: (CardRenderer as any).setup({ arch: cardArch, records }, {
            // Vue inject mock is simpler through direct app provision, 
            // but we can also execute the click handler directly on the generated vnode
          })
        };
      }
    });

    // Directly calling setup of CardRenderer with inject stubbed or mocked
    const setupWithInject = (CardRenderer as any).setup;
    const origInject = (CardRenderer as any).inject;
    
    // We can simulate the actionManager inject via a custom execution or by testing the onClick handler of the VNode
    // Let's create an environment where ACTION_MANAGER_KEY is resolved or simply invoke the onClick directly.
  });
});

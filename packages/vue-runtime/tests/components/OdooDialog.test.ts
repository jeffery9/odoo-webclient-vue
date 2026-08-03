import { describe, test, expect } from 'vitest';
import { h, defineComponent } from 'vue';
import { OdooDialog, OdooDialogOutlet, dialogService, activeDialogs } from '../../src/components/OdooDialog.js';

const DummyChild = defineComponent({
  name: 'DummyChild',
  props: {
    message: { type: String, default: 'Hello World' }
  },
  setup(props) {
    return () => h('div', { class: 'dummy_child_content' }, props.message);
  }
});

describe('Odoo Dialog / Modal Manager Suite', () => {
  test('should open, track and close stacked modals via dialogService', () => {
    // 1. Initial State
    dialogService.clearAll();
    expect(activeDialogs.length).toBe(0);

    // 2. Open First Modal
    const id1 = dialogService.open({
      id: 'dialog_1',
      title: 'First Wizard',
      component: DummyChild,
      props: { message: 'Layer 1' }
    });

    expect(activeDialogs.length).toBe(1);
    expect(activeDialogs[0].title).toBe('First Wizard');

    // 3. Open Stacked Nested Modal (layer 2)
    const id2 = dialogService.open({
      id: 'dialog_2',
      title: 'Second Wizard',
      component: DummyChild,
      props: { message: 'Layer 2' }
    });

    expect(activeDialogs.length).toBe(2);
    expect(activeDialogs[1].title).toBe('Second Wizard');

    // 4. Close top modal
    dialogService.closeTop();
    expect(activeDialogs.length).toBe(1);
    expect(activeDialogs[0].id).toBe(id1);

    // Clean up
    dialogService.clearAll();
  });

  test('should render OdooDialog component successfully with buttons and child components', () => {
    dialogService.clearAll();

    const config = {
      id: 'dialog_test',
      title: 'Interactive Form',
      component: DummyChild,
      props: { message: 'Modal Form Content' }
    };

    const cpInstance = OdooDialog as any;
    const renderFn = cpInstance.setup({ config }, {});
    const vnode = renderFn();

    // Verify Backdrop mask and container classes
    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toContain('o_dialog_mask');

    const container = vnode.children[0];
    expect(container.props.class).toContain('o_dialog_container');

    // Verify Header
    const header = container.children[0];
    expect(header.children[0].children).toBe('Interactive Form');

    // Verify Body contains child component
    const body = container.children[1];
    expect(body.children[0].type).toBe(DummyChild);
    expect(body.children[0].props.message).toBe('Modal Form Content');

    // Verify Footer Buttons
    const footer = container.children[2];
    expect(footer.children[0].children).toBe('丢弃'); // Discard
    expect(footer.children[1].children[1]).toBe('保存并关闭'); // Confirm button label
  });

  test('should render dynamic OdooDialogOutlet with stacked active dialogs', () => {
    dialogService.clearAll();

    // Initial empty state returns null
    const cpInstance = OdooDialogOutlet as any;
    const renderFn = cpInstance.setup({}, {});
    expect(renderFn()).toBeNull();

    // Opening a dialog renders the outlet wrapper
    dialogService.open({
      id: 'dialog_outlet_test',
      title: 'Outlet Check',
      component: DummyChild
    });

    const vnode = renderFn();
    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_dialog_outlet');
    expect(vnode.children.length).toBe(1);
    expect(vnode.children[0].type).toBe(OdooDialog);

    dialogService.clearAll();
  });
});

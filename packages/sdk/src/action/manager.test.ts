import { describe, test, expect } from 'vitest';
import { ActionManager, ActionDescriptor } from './manager.js';

describe('Odoo Action Manager & Stack-based Navigation', () => {
  test('should push window action to main stack and generate breadcrumbs', async () => {
    const manager = new ActionManager();

    const action1: ActionDescriptor = {
      name: 'Sale Orders',
      res_model: 'sale.order',
      type: 'ir.actions.act_window',
      views: [[false, 'list'], [false, 'form']],
      target: 'current'
    };

    await manager.doAction(action1);

    expect(manager.stack.length).toBe(1);
    expect(manager.breadcrumbs).toEqual(['Sale Orders']);
    expect(manager.currentAction?.res_model).toBe('sale.order');
  });

  test('should handle breadcrumb accumulation with sequential target current actions', async () => {
    const manager = new ActionManager();

    const listAction: ActionDescriptor = {
      name: 'Partners',
      res_model: 'res.partner',
      type: 'ir.actions.act_window',
      views: [[false, 'list']],
      target: 'current'
    };

    const formAction: ActionDescriptor = {
      name: 'Mitchell Admin',
      res_model: 'res.partner',
      type: 'ir.actions.act_window',
      views: [[false, 'form']],
      target: 'current',
      res_id: 2
    };

    await manager.doAction(listAction);
    await manager.doAction(formAction);

    expect(manager.stack.length).toBe(2);
    expect(manager.breadcrumbs).toEqual(['Partners', 'Mitchell Admin']);

    // Pop back
    manager.goBack();
    expect(manager.stack.length).toBe(1);
    expect(manager.breadcrumbs).toEqual(['Partners']);
  });

  test('should isolate target new wizard actions in a separate dialog stack', async () => {
    const manager = new ActionManager();

    const listAction: ActionDescriptor = {
      name: 'Sale Orders',
      res_model: 'sale.order',
      type: 'ir.actions.act_window',
      views: [[false, 'list']],
      target: 'current'
    };

    const wizardAction: ActionDescriptor = {
      name: 'Create Invoice Wizard',
      res_model: 'sale.advance.payment.inv',
      type: 'ir.actions.act_window',
      views: [[false, 'form']],
      target: 'new'
    };

    await manager.doAction(listAction);
    await manager.doAction(wizardAction);

    // Main breadcrumbs and stack should remain untouched
    expect(manager.stack.length).toBe(1);
    expect(manager.breadcrumbs).toEqual(['Sale Orders']);

    // Dialog stack should capture the wizard
    expect(manager.dialogStack.length).toBe(1);
    expect(manager.dialogStack[0].name).toBe('Create Invoice Wizard');

    // Closing dialog clears dialog stack
    manager.closeDialog();
    expect(manager.dialogStack.length).toBe(0);
  });
});

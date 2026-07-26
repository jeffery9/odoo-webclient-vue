import { describe, test, expect, vi, beforeAll } from 'vitest';
import { activeClient } from '../src/auth/state.js';
import { ActionManager } from '@odoo/sdk';
import { executeAction, resolveDefaultViewType, parseDomainString } from '../src/workspace/actions.js';
import { activeAction, activeViewType, activeContext, viewArchs } from '../src/workspace/state.js';

describe('Odoo Action Execution Service', () => {
  beforeAll(() => {
    // Setup mock activeClient with full mock implementation
    activeClient.value = {
      uid: 1,
      loadAction: async (actionId: number) => {
        if (actionId === 10) {
          return {
            id: 10,
            type: 'ir.actions.act_window',
            res_model: 'res.partner',
            name: 'Partners',
            view_mode: 'kanban,tree,form',
            context: { default_customer: true },
            domain: []
          };
        } else if (actionId === 20) {
          return {
            id: 20,
            type: 'ir.actions.client',
            tag: 'apps.discuss',
            name: 'Inbox Dashboard',
            params: { show_unread: true },
            context: {}
          };
        } else if (actionId === 30) {
          return {
            id: 30,
            type: 'ir.actions.report',
            report_name: 'account.report_invoice_with_payments',
            report_type: 'qweb-pdf',
            name: 'Invoices Printout',
            context: {}
          };
        } else if (actionId === 40) {
          return {
            id: 40,
            type: 'ir.actions.act_window',
            res_model: 'res.partner',
            name: 'Sales Analysis Dashboard',
            view_mode: 'graph,pivot,calendar',
            context: {},
            domain: []
          };
        }
        return null;
      },
      loadViews: async () => {
        return {
          fields_views: {
            list: { arch: '<tree><field name="name"/></tree>' },
            form: { arch: '<form><field name="name"/></form>' },
            kanban: { arch: '<kanban><field name="name"/></kanban>' },
            graph: { arch: '<graph string="Sales Analysis"><field name="user_id" type="row"/></graph>' },
            pivot: { arch: '<pivot string="Invoices Analysis"><field name="category_id" type="col"/></pivot>' }
          }
        };
      },
      search_read: async () => {
        return [{ id: 1, name: 'Test Record' }];
      },
      call: async () => {
        return 1;
      }
    } as any;
  });

  test('should resolve default view types properly for window actions', () => {
    const action = {
      type: 'ir.actions.act_window',
      view_mode: 'kanban,tree,form'
    };
    expect(resolveDefaultViewType(action)).toBe('kanban');
  });

  test('should load and render client actions bypassing model and view retrieval', async () => {
    // Setup spies to verify they are not called
    const viewsSpy = vi.spyOn(activeClient.value!, 'loadViews');
    const searchSpy = vi.spyOn(activeClient.value!, 'search_read');

    await executeAction(20);

    expect(activeAction.value.type).toBe('ir.actions.client');
    expect(activeAction.value.tag).toBe('apps.discuss');
    expect(activeAction.value.params.show_unread).toBe(true);

    // Bypassed views and search read
    expect(viewsSpy).not.toHaveBeenCalled();
    expect(searchSpy).not.toHaveBeenCalled();

    viewsSpy.mockRestore();
    searchSpy.mockRestore();
  });

  test('should load and render report actions bypassing model and view retrieval', async () => {
    const viewsSpy = vi.spyOn(activeClient.value!, 'loadViews');
    const searchSpy = vi.spyOn(activeClient.value!, 'search_read');

    await executeAction(30);

    expect(activeAction.value.type).toBe('ir.actions.report');
    expect(activeAction.value.report_name).toBe('account.report_invoice_with_payments');
    expect(activeAction.value.report_type).toBe('qweb-pdf');

    // Bypassed views and search read
    expect(viewsSpy).not.toHaveBeenCalled();
    expect(searchSpy).not.toHaveBeenCalled();

    viewsSpy.mockRestore();
    searchSpy.mockRestore();
  });

  test('should load act_window and execute standard view loading and orm retrieval', async () => {
    const viewsSpy = vi.spyOn(activeClient.value!, 'loadViews');
    const searchSpy = vi.spyOn(activeClient.value!, 'search_read');

    await executeAction(10);

    expect(activeAction.value.type).toBe('ir.actions.act_window');
    expect(activeAction.value.res_model).toBe('res.partner');
    expect(activeViewType.value).toBe('kanban'); // first mode from view_mode is kanban

    // Invoked standard ORM & metadata views loading pipeline
    expect(viewsSpy).toHaveBeenCalled();
    expect(searchSpy).toHaveBeenCalled();

    viewsSpy.mockRestore();
    searchSpy.mockRestore();
  });

  test('should generate Odoo-compliant report download URLs in ActionManager', () => {
    const am = new ActionManager();
    const action = {
      id: 30,
      type: 'ir.actions.report',
      report_name: 'sale.report_saleproceeded',
      report_type: 'qweb-pdf'
    };

    const downloadUrl = am.getReportDownloadUrl(action, [5, 12]);
    
    // Odoo format is: /report/download?data=[encoded JSON of ["/report/pdf/report_name/5,12", "pdf"]]
    expect(downloadUrl).toContain('/report/download?data=');
    const decodedJSON = decodeURIComponent(downloadUrl.split('data=')[1]);
    const parsedData = JSON.parse(decodedJSON);
    
    expect(parsedData[0]).toBe('/report/pdf/sale.report_saleproceeded/5,12');
    expect(parsedData[1]).toBe('pdf');
  });

  test('should load and dynamically compile graph and pivot advanced view types', async () => {
    await executeAction(40);

    // activeViewType resolves to 'graph' which is the first mode in action view_mode
    expect(activeViewType.value).toBe('graph');

    // Graph arch should be successfully compiled into semantic AST
    expect(viewArchs.value.graph).toBeDefined();
    expect(viewArchs.value.graph.tag).toBe('graph');
    expect(viewArchs.value.graph.attrs.string).toBe('Sales Analysis');
    expect(viewArchs.value.graph.children[0].tag).toBe('field');
    expect(viewArchs.value.graph.children[0].attrs.name).toBe('user_id');

    // Pivot arch should be successfully compiled into semantic AST
    expect(viewArchs.value.pivot).toBeDefined();
    expect(viewArchs.value.pivot.tag).toBe('pivot');
    expect(viewArchs.value.pivot.attrs.string).toBe('Invoices Analysis');
  });

  describe('parseDomainString Utility', () => {
    test('should parse empty Python lists and tuples', () => {
      expect(parseDomainString('[]')).toEqual([]);
      expect(parseDomainString('()')).toEqual([]);
    });

    test('should parse standard Python domains with simple criteria', () => {
      expect(parseDomainString("[('active', '=', True)]")).toEqual([['active', '=', true]]);
      expect(parseDomainString("[('state', '=', 'draft')]")).toEqual([['state', '=', 'draft']]);
    });

    test('should parse domains containing Python lists and booleans/None', () => {
      expect(parseDomainString("[('state', 'in', ['draft', 'sent']), ('active', '=', False)]"))
        .toEqual([['state', 'in', ['draft', 'sent']], ['active', '=', false]]);
    });

    test('should parse tuples as standard JSON-compatible arrays', () => {
      expect(parseDomainString("[('state', 'in', ('draft', 'sent'))]"))
        .toEqual([['state', 'in', ['draft', 'sent']]]);
    });
  });
});
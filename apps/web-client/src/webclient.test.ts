import { describe, test, expect, vi } from 'vitest';
import { RecordProxy, RPCClient, SessionManager, ArchCompiler } from '@odoo/sdk';

describe('Odoo WebClient Dynamic Boot & TDD Metadrive Pipeline', () => {
  test('should execute full dynamic sequence: login -> load_menus -> load_action -> load_views -> compile -> search_read', async () => {
    // 1. Mock the Odoo network responses (High-Fidelity Contract)
    const mockMenus = {
      root: { id: 'root', children: [1, 2] },
      1: { id: 1, name: 'Contacts App', actionID: 'ir.actions.act_window,101', children: [3] },
      2: { id: 2, name: 'Inventory App', actionID: 'ir.actions.act_window,102', children: [] },
      3: { id: 3, name: 'Sub Contact List', actionID: 'ir.actions.act_window,101' }
    };

    const mockAction = {
      id: 101,
      name: 'Contacts',
      res_model: 'res.partner',
      views: [[false, 'list'], [false, 'form']],
      domain: [['active', '=', true]],
      limit: 80
    };

    const mockViewsResponse = {
      fields_views: {
        list: {
          arch: `<tree><field name="name"/><field name="email"/></tree>`
        },
        form: {
          arch: `<form><sheet><field name="name"/></sheet></form>`
        }
      }
    };

    const mockSearchReadData = [
      { id: 42, name: 'Mitchell Admin', email: 'admin@odoo.com' },
      { id: 43, name: 'Marc Demo', email: 'demo@odoo.com' }
    ];

    // 2. Setup Spies on RPCClient
    const client = new RPCClient({ endpoint: 'http://localhost:8069' });
    
    const requestSpy = vi.spyOn(client, 'request').mockImplementation(async (urlPath, params) => {
      if (urlPath === '/web/session/authenticate') {
        return { uid: 1, name: 'Administrator', db: 'demo' };
      }
      if (urlPath === '/web/webclient/load_menus') {
        return mockMenus;
      }
      if (urlPath === '/web/action/load') {
        expect((params as any).action_id).toBe(101);
        return mockAction;
      }
      throw new Error(`Unexpected request: ${urlPath}`);
    });

    const callSpy = vi.spyOn(client, 'call').mockImplementation(async (model, method, args, kwargs) => {
      if (model === 'res.partner' && method === 'load_views') {
        return mockViewsResponse;
      }
      if (model === 'res.partner' && method === 'search_count') {
        return 2;
      }
      if (model === 'res.partner' && method === 'search_read') {
        return mockSearchReadData;
      }
      throw new Error(`Unexpected call_kw: ${model}.${method}`);
    });

    // 3. Step 1: Authentication Flow
    const session = new SessionManager(client);
    const loginResult = await session.login('demo', 'admin', 'admin');
    expect(loginResult.uid).toBe(1);
    expect(requestSpy).toHaveBeenCalledWith('/web/session/authenticate', {
      db: 'demo',
      login: 'admin',
      password: 'admin'
    });

    // 4. Step 2: Fetch and parse dynamic menu structure
    const serverMenus = await client.loadMenus();
    expect(requestSpy).toHaveBeenCalledWith('/web/webclient/load_menus', { hash: '' });
    expect(serverMenus.root.children).toEqual([1, 2]);

    const apps = serverMenus.root.children.map((mid: number) => serverMenus[mid]);
    expect(apps[0].name).toBe('Contacts App');

    // 5. Step 3: Trigger action and load views
    const actionID = 101;
    const action = await client.loadAction(actionID);
    expect(requestSpy).toHaveBeenCalledWith('/web/action/load', { action_id: 101 });
    expect(action.res_model).toBe('res.partner');

    // 6. Step 4: Load views and compile live XML Arch on the fly
    const viewResponse = await client.loadViews(action.res_model, action.views);
    expect(callSpy).toHaveBeenCalledWith('res.partner', 'load_views', [[]], {
      views: [[false, 'list'], [false, 'form']],
      options: {}
    });

    const listXml = viewResponse.fields_views.list.arch;
    const compiledListArch = ArchCompiler.compile(listXml);
    expect(compiledListArch.tag).toBe('tree');
    expect(compiledListArch.children[0].attrs.name).toBe('name');

    // 7. Step 5: Query dynamic records matching Action specs
    const count = await client.call(action.res_model, 'search_count', [action.domain], {});
    expect(count).toBe(2);

    const records = await client.search_read(action.res_model, action.domain, ['name', 'email'], action.limit);
    expect(records.length).toBe(2);
    expect(records[0].name).toBe('Mitchell Admin');

    // 8. Wrap records into active SDK proxies
    const proxies = records.map(r => new RecordProxy(action.res_model, r, client));
    expect(proxies[0].get('name')).toBe('Mitchell Admin');
  });
});

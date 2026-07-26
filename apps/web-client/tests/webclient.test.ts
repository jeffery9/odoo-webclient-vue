import { describe, test, expect, vi } from 'vitest';
import { RecordProxy, RPCClient, SessionManager, ArchCompiler, Context } from '@odoo/sdk';

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
        return {
          uid: 1,
          name: 'Administrator',
          db: 'demo',
          company_id: 1,
          user_companies: {
            current_company: [1, 'San Francisco HQ'],
            allowed_companies: {
              '1': { id: 1, name: 'San Francisco HQ' },
              '2': { id: 2, name: 'Chicago Branch' }
            }
          }
        };
      }
      if (urlPath === '/web/webclient/load_menus') {
        return mockMenus;
      }
      if (urlPath === '/web/webclient/translations') {
        return { lang: 'en_US', modules: {} };
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
      if (model === 'res.partner.category' && method === 'search_read') {
        return [
          { id: 1, name: 'VIP Clients' },
          { id: 2, name: 'Standard Partners' }
        ];
      }
      if (model === 'res.users' && method === 'search_read') {
        return [
          { id: 1, name: 'Administrator' },
          { id: 2, name: 'Demo User' }
        ];
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

    const transResponse = await client.loadTranslations('en_US');
    expect(requestSpy).toHaveBeenCalledWith('/web/webclient/translations', { lang: 'en_US', hash: '' });
    expect(transResponse.lang).toBe('en_US');

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

  test('should compute isOdooAddonMode and resolve hostUrl settings', () => {
    // Setup simulated global window object for node test runners
    const originalWindow = (global as any).window;
    (global as any).window = {
      location: {
        pathname: '/my_addon/static/src/index.html',
        origin: 'https://odoo-enterprise.com'
      }
    };

    // Check pathname detection triggers
    const addonMode = (global as any).window.location.pathname.includes('/static/');
    expect(addonMode).toBe(true);

    const hostUrl = addonMode ? (global as any).window.location.origin : 'http://localhost:8069';
    expect(hostUrl).toBe('https://odoo-enterprise.com');

    // Restore state
    if (originalWindow) {
      (global as any).window = originalWindow;
    } else {
      delete (global as any).window;
    }
  });

  test('should parse action context, pre-populate default fields, and forward context kwargs during write/create', async () => {
    const client = new RPCClient({ endpoint: 'http://localhost:8069' });
    const createSpy = vi.spyOn(client, 'create').mockResolvedValue(99);

    // 1. Mock an Action containing custom Odoo Context
    const mockAction = {
      id: 202,
      name: 'Dynamic Action',
      res_model: 'res.partner',
      context: "{'default_active': False, 'default_customer': True, 'default_type': 'contact'}"
    };

    // 2. Parse and evaluate Odoo context string
    const evaluatedContext = Context.merge([mockAction.context], { uid: 1 });
    expect(evaluatedContext.default_active).toBe(false);
    expect(evaluatedContext.default_customer).toBe(true);
    expect(evaluatedContext.default_type).toBe('contact');

    // 3. Scan default_ keys to pre-populate record proxies
    const defaultValues: Record<string, any> = {};
    for (const [key, value] of Object.entries(evaluatedContext)) {
      if (key.startsWith('default_')) {
        const fieldName = key.substring(8);
        defaultValues[fieldName] = value;
      }
    }

    expect(defaultValues).toEqual({
      active: false,
      customer: true,
      type: 'contact'
    });

    const newRecord = new RecordProxy('res.partner', { id: null, name: 'New Record', ...defaultValues }, client);
    expect(newRecord.get('active')).toBe(false);
    expect(newRecord.get('customer')).toBe(true);
    expect(newRecord.get('type')).toBe('contact');

    // 4. Save and verify context parameter is passed down to RPCClient.create kwargs
    newRecord.set('name', ' Mitchell Admin (Saved)');
    await newRecord.save(evaluatedContext);

    expect(createSpy).toHaveBeenCalledWith('res.partner', {
      name: ' Mitchell Admin (Saved)',
      active: false,
      customer: true,
      type: 'contact'
    }, evaluatedContext);
  });

  test('should compile and render Odoo 19-style Left-Side SearchPanel with reactive multidimensional filtering', async () => {
    // 1. Compile search XML with <searchpanel> tag
    const searchXml = `
      <search>
        <searchpanel>
          <field name="category_id" string="Category" select="one" icon="fa-folder"/>
          <field name="user_id" string="Responsible" select="multi" icon="fa-users"/>
        </searchpanel>
      </search>
    `;

    const compiledSearchArch = ArchCompiler.compile(searchXml);
    expect(compiledSearchArch.tag).toBe('search');
    expect(compiledSearchArch.children[0].tag).toBe('searchpanel');
    expect(compiledSearchArch.children[0].children.length).toBe(2);
    expect(compiledSearchArch.children[0].children[0].attrs.name).toBe('category_id');
    expect(compiledSearchArch.children[0].children[0].attrs.string).toBe('Category');

    // 2. Simulate SearchPanel filter selection
    const activeFilters = {
      category_id: 2,
      user_id: 1
    };

    const domain: any[] = [];
    for (const [key, val] of Object.entries(activeFilters)) {
      domain.push([key, '=', val]);
    }

    expect(domain).toEqual([
      ['category_id', '=', 2],
      ['user_id', '=', 1]
    ]);

    // 3. Verify merging searchPanel domains with Action base domains
    const baseActionDomain = [['active', '=', true]];
    const combinedMergedDomain = [...baseActionDomain, ...domain];

    expect(combinedMergedDomain).toEqual([
      ['active', '=', true],
      ['category_id', '=', 2],
      ['user_id', '=', 1]
    ]);
  });
});

import { resolveDefaultViewType } from '../src/workspace/actions.js';

describe('Odoo Action Dynamic Default View Resolution', () => {
  test('should resolve default active view type from view_mode string', () => {
    const action1 = { view_mode: 'kanban,tree,form' };
    expect(resolveDefaultViewType(action1)).toBe('kanban');

    const action2 = { view_mode: 'form,list' };
    expect(resolveDefaultViewType(action2)).toBe('form');

    const action3 = { view_mode: 'tree,form' };
    expect(resolveDefaultViewType(action3)).toBe('list');
  });

  test('should fallback to views array list if view_mode is not defined', () => {
    const action = {
      views: [
        [false, 'kanban'],
        [false, 'form']
      ]
    };
    expect(resolveDefaultViewType(action)).toBe('kanban');
  });

  test('should default to list if no valid views are specified', () => {
    expect(resolveDefaultViewType(null)).toBe('list');
    expect(resolveDefaultViewType({})).toBe('list');
  });
});

import { componentRegistry } from '@odoo/vue-runtime';
import { FieldCommunityDate } from '../src/widgets/FieldCommunityDate.js';

describe('Odoo Vue Community Datepicker Adapter Integration', () => {
  test('should successfully register FieldCommunityDate as date override', () => {
    componentRegistry.add('date', FieldCommunityDate);
    expect(componentRegistry.get('date')).toBe(FieldCommunityDate);
  });

  test('should compile FieldCommunityDate adapter props mapping', () => {
    const record = new RecordProxy('res.partner', { birth_date: '1998-05-15' });
    const widget = FieldCommunityDate;
    
    // Evaluate Vue render functional output
    const renderFn = widget.setup({ record, name: 'birth_date', readonly: false }, {});
    const vnode = renderFn();

    // Verify it returns the premium VueDatePicker VNode component
    expect(vnode.type).toBeDefined();
    expect(vnode.props.format).toBe('yyyy-MM-dd');
    expect(vnode.props.enableTimePicker).toBe(false);
  });
});

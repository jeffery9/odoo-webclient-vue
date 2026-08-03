import { describe, test, expect } from 'vitest';
import { SearchView, SearchPanelRenderer, getPrimaryRange, getComparisonRange } from '../../src/renderers/SearchView.js';

describe('SearchView and SearchPanelRenderer', () => {
  const searchArch = {
    tag: 'search',
    children: [
      { tag: 'field', attrs: { name: 'name', string: 'Name' } },
      { tag: 'field', attrs: { name: 'user_id', string: 'Responsible' } },
      { tag: 'filter', attrs: { string: 'Draft', name: 'draft', domain: "[('state', '=', 'draft')]" } },
      { tag: 'filter', attrs: { string: 'Salesperson', name: 'groupby_user', context: "{'group_by': 'user_id'}" } },
      {
        tag: 'searchpanel',
        children: [
          { tag: 'field', attrs: { name: 'category_id', string: 'Category' } }
        ]
      }
    ]
  };

  test('should render SearchView multi-criteria input grid, filters, and groupbys successfully', () => {
    const fieldValues = { name: '', user_id: null };
    const activeFilters: string[] = [];
    const activeGroupBys: string[] = [];

    const cpInstance = SearchView as any;
    const renderFn = cpInstance.setup({
      arch: searchArch,
      fieldValues,
      activeFilters,
      activeGroupBys
    }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toContain('o_odoo_search_view');

    const gridDiv = vnode.children[1];
    expect(gridDiv.props.class).toContain('grid');
    expect(gridDiv.children.length).toBe(2); // name, user_id inputs
    expect(gridDiv.children[0].children[0].children).toBe('Name');
    expect(gridDiv.children[1].children[0].children).toBe('Responsible');

    const filterDiv = vnode.children[2];
    expect(filterDiv.children[0].children).toBe('快捷过滤 (Quick Filters)');
    expect(filterDiv.children[1].type).toBe('el-checkbox-group');

    const groupbyDiv = vnode.children[3];
    expect(groupbyDiv.children[0].children).toBe('数据分组 (Group By)');
    expect(groupbyDiv.children[1].type).toBe('el-checkbox-group');
  });

  test('should render SearchPanelRenderer hierarchical sidebar successfully', () => {
    const cpInstance = SearchPanelRenderer as any;
    const renderFn = cpInstance.setup({
      arch: searchArch
    }, {});
    const vnode = renderFn();

    expect(vnode.type).toBe('aside');
    expect(vnode.props.class).toContain('o_search_panel_renderer');

    const treeContainer = vnode.children[1];
    expect(treeContainer.children[0].children).toBe('Category');
    expect(treeContainer.children[1].type).toBe('el-tree');
  });

  test('should compute correct primary and comparison date ranges for YoY and MoM', () => {
    const [thisYearStart, thisYearEnd] = getPrimaryRange('this_year', null);
    const currentYear = new Date().getFullYear();
    expect(thisYearStart).toBe(`${currentYear}-01-01`);
    expect(thisYearEnd).toBe(`${currentYear}-12-31`);

    // Test YoY (-1 year offset)
    const [yoyStart, yoyEnd] = getComparisonRange('2026-08-01', '2026-08-31', 'yoy');
    expect(yoyStart).toBe('2025-08-01');
    expect(yoyEnd).toBe('2025-08-31');

    // Test MoM (length of period offset, 31 days)
    const [momStart, momEnd] = getComparisonRange('2026-08-01', '2026-08-31', 'mom');
    expect(momStart).toBe('2026-07-01');
    expect(momEnd).toBe('2026-07-31');
  });
});

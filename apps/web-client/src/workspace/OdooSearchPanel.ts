import { h, defineComponent, ref, watch, onMounted } from 'vue';
import { activeClient } from '../auth/state.js';
import { activeContext } from './state.js';

// Setup Field to Relation model lookup
const FIELD_RELATIONS: Record<string, string> = {
  category_id: 'res.partner.category',
  user_id: 'res.users',
  company_id: 'res.company'
};

export const OdooSearchPanel = defineComponent({
  name: 'OdooSearchPanel',
  props: {
    arch: { type: Object, required: true },
    onFilterChange: { type: Function, required: true }
  },
  setup(props) {
    const selections = ref<Record<string, any[]>>({});
    const fieldTrees = ref<Record<string, any[]>>({});

    // 1. Extract searchpanel field definition nodes
    const getSearchFields = () => {
      if (!props.arch || props.arch.tag !== 'search') return [];
      const panel = props.arch.children?.find((c: any) => c.tag === 'searchpanel');
      if (!panel) return [];
      return panel.children?.filter((c: any) => c.tag === 'field') || [];
    };

    // 2. Load relational choices and compile hierarchical tree nodes
    const loadFieldTrees = async () => {
      if (!activeClient.value) return;
      const fields = getSearchFields();

      for (const f of fields) {
        const name = f.attrs.name;
        const relationModel = FIELD_RELATIONS[name];
        if (relationModel) {
          try {
            // Fetch records from Odoo
            const records = await activeClient.value.search_read(
              relationModel,
              [],
              ['name', 'parent_id'],
              undefined,
              undefined,
              activeContext.value
            );

            // Construct standard nested tree from records
            const treeData = buildHierarchy(records);
            fieldTrees.value[name] = treeData;
          } catch (e) {
            fieldTrees.value[name] = [];
          }
        }
      }
    };

    // Build hierarchy using parent_id bindings
    const buildHierarchy = (records: any[]): any[] => {
      const recordMap: Record<number, any> = {};
      const roots: any[] = [];

      // Create mapping and initialize children arrays
      records.forEach((r) => {
        recordMap[r.id] = {
          id: r.id,
          label: r.name || r.display_name || `ID ${r.id}`,
          children: []
        };
      });

      // Tie children to parents, or put in roots
      records.forEach((r) => {
        const mapped = recordMap[r.id];
        const parentId = Array.isArray(r.parent_id) ? r.parent_id[0] : r.parent_id;

        if (parentId && recordMap[parentId]) {
          recordMap[parentId].children.push(mapped);
        } else {
          roots.push(mapped);
        }
      });

      return roots;
    };

    onMounted(loadFieldTrees);
    watch(() => props.arch, loadFieldTrees, { deep: true });

    // 3. Track tree node selections and propagate domains to MainWorkspace
    const handleNodeCheck = (fieldName: string, checkedKeys: any[]) => {
      selections.value[fieldName] = checkedKeys;

      const domains: any[] = [];
      for (const [key, selectedIds] of Object.entries(selections.value)) {
        if (selectedIds && selectedIds.length > 0) {
          if (selectedIds.length === 1) {
            domains.push([key, '=', selectedIds[0]]);
          } else {
            // Multi-select or: construct standard Odoo OR wrapped list
            const orList: any[] = [];
            for (let i = 0; i < selectedIds.length - 1; i++) {
              orList.push('|');
            }
            selectedIds.forEach((id) => orList.push([key, '=', id]));
            domains.push(...orList);
          }
        }
      }

      props.onFilterChange(domains);
    };

    return () => {
      const fields = getSearchFields();
      if (fields.length === 0) return null;

      return h('aside', {
        class: 'o_odoo_search_panel',
        style: 'width: 260px; background: white; border-right: 1px solid #e2e8f0; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px;'
      }, [
        h('div', {
          style: 'font-size: 14px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; display: flex; align-items: center; gap: 8px;'
        }, [
          h('span', null, '📂 层级过滤面板')
        ]),

        fields.map((f: any) => {
          const name = f.attrs.name;
          const label = f.attrs.string || name.replace('_id', '').toUpperCase();
          const treeData = fieldTrees.value[name] || [];

          return h('div', { key: name, style: 'display: flex; flex-direction: column; gap: 10px;' }, [
            h('div', {
              style: 'font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;'
            }, label),

            // Render standard Element Plus Hierarchical el-tree with checkboxes
            h('el-tree', {
              data: treeData,
              showCheckbox: true,
              nodeKey: 'id',
              defaultExpandAll: true,
              props: {
                label: 'label',
                children: 'children'
              },
              onCheckChange: () => {
                // To fetch checked keys cleanly under TS, we get the reference of active tree nodes
              },
              onCheck: (node: any, checkState: any) => {
                handleNodeCheck(name, checkState.checkedKeys);
              },
              style: 'font-size: 13px; color: #334155; --el-tree-node-hover-bg-color: #f1f5f9; --el-color-primary: #714B67;'
            })
          ]);
        })
      ]);
    };
  }
});
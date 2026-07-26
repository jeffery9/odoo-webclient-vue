import { defineComponent, h, inject } from 'vue';
import { ACTION_MANAGER_KEY } from './di.js';
import { componentRegistry } from './registry.js';

export const FieldChar = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val) : '';

      if (props.readonly) {
        return h('span', { class: 'o_field_char o_readonly' }, strVal);
      }

      return h('input', {
        class: 'o_field_char',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});

export const FieldText = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val) : '';

      if (props.readonly) {
        return h('span', { class: 'o_field_text o_readonly', style: 'white-space: pre-wrap' }, strVal);
      }

      return h('textarea', {
        class: 'o_field_text',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});

export const FieldHtml = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val) : '';

      if (props.readonly) {
        return h('div', { class: 'o_field_html o_readonly', innerHTML: strVal });
      }

      return h('div', {
        class: 'o_field_html',
        contenteditable: true,
        style: 'border: 1px solid #ccc; padding: 6px; min-height: 40px; border-radius: 4px;',
        onBlur: (e: any) => props.record?.set(props.name, e.target.innerHTML),
        innerHTML: strVal
      });
    };
  }
});

export const FieldInteger = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const numVal = typeof val === 'number' ? val : 0;

      if (props.readonly) {
        return h('span', { class: 'o_field_number o_readonly' }, String(numVal));
      }

      return h('input', {
        type: 'number',
        step: '1',
        class: 'o_field_number',
        value: numVal,
        onInput: (e: any) => props.record?.set(props.name, Math.round(Number(e.target.value)))
      });
    };
  }
});

export const FieldFloat = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const numVal = typeof val === 'number' ? val : 0.0;

      if (props.readonly) {
        return h('span', { class: 'o_field_number o_readonly' }, String(numVal));
      }

      return h('input', {
        type: 'number',
        step: 'any',
        class: 'o_field_number',
        value: numVal,
        onInput: (e: any) => props.record?.set(props.name, Number(e.target.value))
      });
    };
  }
});

export const FieldMonetary = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const numVal = typeof val === 'number' ? val : 0.0;

      if (props.readonly) {
        return h('span', { class: 'o_field_number o_readonly' }, String(numVal));
      }

      return h('input', {
        type: 'number',
        step: 'any',
        class: 'o_field_number',
        value: numVal,
        onInput: (e: any) => props.record?.set(props.name, Number(e.target.value))
      });
    };
  }
});

export const FieldBoolean = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = !!props.record?.get(props.name);

      if (props.readonly) {
        return h('span', { class: 'o_field_boolean o_readonly' }, val ? 'Yes' : 'No');
      }

      return h('input', {
        type: 'checkbox',
        class: 'o_field_boolean',
        checked: val,
        onChange: (e: any) => props.record?.set(props.name, e.target.checked)
      });
    };
  }
});

export const FieldSelection = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    selection: { type: Array, default: () => [] } // array of [value, label]
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val) : '';

      const selectionList = (props.selection || []) as any[];

      if (props.readonly) {
        const found = selectionList.find((item: any) => item[0] === strVal);
        return h('span', { class: 'o_field_selection o_readonly' }, found ? found[1] : strVal);
      }

      const options = selectionList.map((item: any) => {
        return h('option', { value: item[0] }, item[1]);
      });

      return h('select', {
        class: 'o_field_selection',
        value: strVal,
        onChange: (e: any) => props.record?.set(props.name, e.target.value)
      }, options);
    };
  }
});

export const FieldDate = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val).split(' ')[0] : '';

      if (props.readonly) {
        return h('span', { class: 'o_field_date o_readonly' }, strVal);
      }

      return h('input', {
        type: 'date',
        class: 'o_field_date',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});

export const FieldDatetime = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val).replace(' ', 'T') : '';

      if (props.readonly) {
        return h('span', { class: 'o_field_datetime o_readonly' }, strVal.replace('T', ' '));
      }

      return h('input', {
        type: 'datetime-local',
        class: 'o_field_datetime',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value.replace('T', ' '))
      });
    };
  }
});

export const FieldMany2one = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const displayVal = Array.isArray(val) ? val[1] : (val !== null && val !== undefined ? String(val) : '');

      if (props.readonly) {
        return h('span', { class: 'o_field_many2one o_readonly' }, displayVal);
      }

      return h('input', {
        class: 'o_field_many2one',
        value: displayVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});

export const FieldOne2many = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    subViews: { type: Array, default: () => [] }
  },
  setup(props) {
    const actionManager = inject(ACTION_MANAGER_KEY, null);

    return () => {
      const treeNode = (props.subViews || []).find((v: any) => v.tag === 'tree' || v.tag === 'list') as any;
      const cardNode = (props.subViews || []).find((v: any) => v.tag === 'card') as any;
      const val = props.record?.get(props.name) || [];
      const childRecords = Array.isArray(val) ? val : [];

      // Render modern Card Grid Layout if card view is configured
      if (cardNode) {
        const cardFields = (cardNode.children || []).filter((c: any) => c.tag === 'field');
        const cards = childRecords.map((childRec: any) => {
          const fieldsVNodes = cardFields.map((f: any) => {
            const fieldName = f.attrs.name;
            const widgetName = f.attrs.widget || 'char';
            const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');
            return h('div', { class: 'o_card_field', style: 'margin-bottom: 4px;' }, [
              h('strong', { style: 'margin-right: 4px;' }, f.attrs?.string || fieldName),
              h(widgetComp, { record: childRec, name: fieldName, readonly: true })
            ]);
          });

          return h('div', {
            class: 'o_subview_card',
            style: 'border: 1px solid #ddd; padding: 12px; border-radius: 6px; flex: 1 1 200px; cursor: pointer;',
            onClick: () => {
              if (actionManager) {
                actionManager.doAction({
                  name: 'Edit Relation Card',
                  res_model: 'sub.model',
                  type: 'ir.actions.act_window',
                  views: [[false, 'form']],
                  target: 'new',
                  res_id: childRec.id
                });
              }
            }
          }, fieldsVNodes);
        });

        return h('div', { class: 'o_card_grid', style: 'display: flex; flex-wrap: wrap; gap: 12px;' }, cards);
      }

      // 1. Fallback rendering if no nested tree definition is present
      if (!treeNode) {
        if (props.readonly) {
          const spans = childRecords.map((item: any) => h('span', { class: 'o_tag', style: 'margin-right: 5px' }, String(item.id || item)));
          return h('div', { class: 'o_field_relational o_readonly' }, spans);
        }

        const tags = childRecords.map((item: any) => h('span', { class: 'o_tag', style: 'margin-right: 5px' }, String(item.id || item)));
        const addBtn = h('button', {
          type: 'button',
          class: 'o_btn o_btn_secondary',
          onClick: () => props.record?.set(props.name, [...childRecords, childRecords.length + 1])
        }, '+ Add Item');

        return h('div', { class: 'o_field_relational' }, [tags, addBtn]);
      }

      // 2. High-fidelity dynamic list sub-view rendering
      const fields = (treeNode.children || []).filter((c: any) => c.tag === 'field');
      const editable = treeNode.attrs?.editable;

      const ths = fields.map((f: any) => h('th', f.attrs?.string || f.attrs?.name || ''));
      const thead = h('thead', null, h('tr', null, ths));

      const rows = childRecords.map((childRec: any) => {
        const tds = fields.map((f: any) => {
          const fieldName = f.attrs.name;
          if (editable && !props.readonly) {
            const widgetName = f.attrs.widget || 'char';
            const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');
            return h('td', null, h(widgetComp, {
              record: childRec,
              name: fieldName,
              readonly: false
            }));
          } else {
            const cellVal = childRec?.get ? childRec.get(fieldName) : (childRec[fieldName] || '');
            return h('td', null, h('span', { class: 'o_cell_value' }, String(cellVal)));
          }
        });

        return h('tr', {
          onClick: () => {
            if (!editable && actionManager) {
              actionManager.doAction({
                name: 'Edit Relation Record',
                res_model: 'sub.model',
                type: 'ir.actions.act_window',
                views: [[false, 'form']],
                target: 'new',
                res_id: childRec.id
              });
            }
          }
        }, tds);
      });

      const tbody = h('tbody', null, rows);
      return h('table', { class: 'o_list_view o_subview_list' }, [thead, tbody]);
    };
  }
});

export const FieldMany2many = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    subViews: { type: Array, default: () => [] }
  },
  setup(props) {
    const actionManager = inject(ACTION_MANAGER_KEY, null);

    return () => {
      const treeNode = (props.subViews || []).find((v: any) => v.tag === 'tree' || v.tag === 'list') as any;
      const cardNode = (props.subViews || []).find((v: any) => v.tag === 'card') as any;
      const val = props.record?.get(props.name) || [];
      const childRecords = Array.isArray(val) ? val : [];

      // Render modern Card Grid Layout if card view is configured
      if (cardNode) {
        const cardFields = (cardNode.children || []).filter((c: any) => c.tag === 'field');
        const cards = childRecords.map((childRec: any) => {
          const fieldsVNodes = cardFields.map((f: any) => {
            const fieldName = f.attrs.name;
            const widgetName = f.attrs.widget || 'char';
            const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');
            return h('div', { class: 'o_card_field', style: 'margin-bottom: 4px;' }, [
              h('strong', { style: 'margin-right: 4px;' }, f.attrs?.string || fieldName),
              h(widgetComp, { record: childRec, name: fieldName, readonly: true })
            ]);
          });

          return h('div', {
            class: 'o_subview_card',
            style: 'border: 1px solid #ddd; padding: 12px; border-radius: 6px; flex: 1 1 200px; cursor: pointer;',
            onClick: () => {
              if (actionManager) {
                actionManager.doAction({
                  name: 'Edit Relation Card',
                  res_model: 'sub.model',
                  type: 'ir.actions.act_window',
                  views: [[false, 'form']],
                  target: 'new',
                  res_id: childRec.id
                });
              }
            }
          }, fieldsVNodes);
        });

        return h('div', { class: 'o_card_grid', style: 'display: flex; flex-wrap: wrap; gap: 12px;' }, cards);
      }

      if (!treeNode) {
        if (props.readonly) {
          const spans = childRecords.map((item: any) => h('span', { class: 'o_tag', style: 'margin-right: 5px' }, String(item.id || item)));
          return h('div', { class: 'o_field_relational o_readonly' }, spans);
        }

        const tags = childRecords.map((item: any) => h('span', { class: 'o_tag', style: 'margin-right: 5px' }, String(item.id || item)));
        const addBtn = h('button', {
          type: 'button',
          class: 'o_btn o_btn_secondary',
          onClick: () => props.record?.set(props.name, [...childRecords, childRecords.length + 1])
        }, '+ Link Item');

        return h('div', { class: 'o_field_relational' }, [tags, addBtn]);
      }

      const fields = (treeNode.children || []).filter((c: any) => c.tag === 'field');
      const editable = treeNode.attrs?.editable;

      const ths = fields.map((f: any) => h('th', f.attrs?.string || f.attrs?.name || ''));
      const thead = h('thead', null, h('tr', null, ths));

      const rows = childRecords.map((childRec: any) => {
        const tds = fields.map((f: any) => {
          const fieldName = f.attrs.name;
          if (editable && !props.readonly) {
            const widgetName = f.attrs.widget || 'char';
            const widgetComp = componentRegistry.has(widgetName) ? componentRegistry.get(widgetName) : componentRegistry.get('char');
            return h('td', null, h(widgetComp, {
              record: childRec,
              name: fieldName,
              readonly: false
            }));
          } else {
            const cellVal = childRec?.get ? childRec.get(fieldName) : (childRec[fieldName] || '');
            return h('td', null, h('span', { class: 'o_cell_value' }, String(cellVal)));
          }
        });

        return h('tr', {
          onClick: () => {
            if (!editable && actionManager) {
              actionManager.doAction({
                name: 'Edit Relation Record',
                res_model: 'sub.model',
                type: 'ir.actions.act_window',
                views: [[false, 'form']],
                target: 'new',
                res_id: childRec.id
              });
            }
          }
        }, tds);
      });

      const tbody = h('tbody', null, rows);
      return h('table', { class: 'o_list_view o_subview_list' }, [thead, tbody]);
    };
  }
});

import { defineComponent, h, inject } from 'vue';
import { ACTION_MANAGER_KEY } from './di.js';
import { componentRegistry, viewRegistry } from './registry.js';
import { ListRenderer, CardRenderer } from './renderers.js';

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
    relation: { type: String, default: '' },
    subViews: { type: Array, default: () => [] }
  },
  setup(props) {
    return () => {
      const treeNode = (props.subViews || []).find((v: any) => v.tag === 'tree' || v.tag === 'list');
      const cardNode = (props.subViews || []).find((v: any) => v.tag === 'card');
      const val = props.record?.get(props.name) || [];
      const childRecords = Array.isArray(val) ? val : [];

      let activeArch = treeNode;
      if (!activeArch && !cardNode) {
        const targetModel = props.relation || childRecords[0]?.modelName || '';
        const defaultListArch = targetModel && viewRegistry.has(`${targetModel}/list`) ? viewRegistry.get(`${targetModel}/list`) : null;
        
        activeArch = defaultListArch || {
          tag: 'tree',
          children: [
            { tag: 'field', attrs: { name: 'id', string: 'ID' } },
            { tag: 'field', attrs: { name: 'display_name', string: 'Name' } }
          ]
        };
      }

      if (activeArch) {
        return h(ListRenderer, { arch: activeArch, records: childRecords });
      }

      if (cardNode) {
        return h(CardRenderer, { arch: cardNode, records: childRecords });
      }
    };
  }
});

export const FieldMany2many = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    relation: { type: String, default: '' },
    subViews: { type: Array, default: () => [] }
  },
  setup(props) {
    return () => {
      const treeNode = (props.subViews || []).find((v: any) => v.tag === 'tree' || v.tag === 'list');
      const cardNode = (props.subViews || []).find((v: any) => v.tag === 'card');
      const val = props.record?.get(props.name) || [];
      const childRecords = Array.isArray(val) ? val : [];

      let activeArch = treeNode;
      if (!activeArch && !cardNode) {
        const targetModel = props.relation || childRecords[0]?.modelName || '';
        const defaultListArch = targetModel && viewRegistry.has(`${targetModel}/list`) ? viewRegistry.get(`${targetModel}/list`) : null;
        
        activeArch = defaultListArch || {
          tag: 'tree',
          children: [
            { tag: 'field', attrs: { name: 'id', string: 'ID' } },
            { tag: 'field', attrs: { name: 'display_name', string: 'Name' } }
          ]
        };
      }

      if (activeArch) {
        return h(ListRenderer, { arch: activeArch, records: childRecords });
      }

      if (cardNode) {
        return h(CardRenderer, { arch: cardNode, records: childRecords });
      }
    };
  }
});

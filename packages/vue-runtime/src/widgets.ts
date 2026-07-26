import { defineComponent, h, inject, ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';
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

export const FieldUrl = defineComponent({
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
        return h('a', { class: 'o_field_url o_readonly', href: strVal, target: '_blank', style: 'color: #00878a; text-decoration: underline;' }, strVal);
      }

      return h('input', {
        class: 'o_field_url',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});

export const FieldEmail = defineComponent({
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
        return h('a', { class: 'o_field_email o_readonly', href: 'mailto:' + strVal, style: 'color: #00878a; text-decoration: underline;' }, strVal);
      }

      return h('input', {
        type: 'email',
        class: 'o_field_email',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});

export const FieldPhone = defineComponent({
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
        return h('a', { class: 'o_field_phone o_readonly', href: 'tel:' + strVal, style: 'color: #00878a; text-decoration: underline;' }, strVal);
      }

      return h('input', {
        type: 'tel',
        class: 'o_field_phone',
        value: strVal,
        onInput: (e: any) => props.record?.set(props.name, e.target.value)
      });
    };
  }
});

export const FieldBadge = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val) : '';

      return h('span', {
        class: 'o_badge',
        style: 'display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 12px; background-color: #e2e8f0; color: #475569;'
      }, strVal);
    };
  }
});

export const FieldProgressBar = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const percent = Math.min(100, Math.max(0, Number(val) || 0));

      return h('div', {
        class: 'o_progress_bar_container',
        style: 'width: 100%; background-color: #e2e8f0; border-radius: 4px; overflow: hidden; display: flex; align-items: center;'
      }, [
        h('div', {
          class: 'o_progress_bar',
          style: `width: ${percent}%; background-color: #00878a; color: white; text-align: center; font-size: 10px; padding: 2px 0; transition: width 0.3s ease;`
        }, `${percent}%`)
      ]);
    };
  }
});

export const FieldPriority = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const rating = Math.min(5, Math.max(0, Math.round(Number(val) || 0)));

      const stars = Array.from({ length: 5 }, (_, i) => {
        const active = i < rating;
        return h('span', {
          style: `cursor: ${props.readonly ? 'default' : 'pointer'}; font-size: 16px; color: ${active ? '#f59e0b' : '#cbd5e1'}; margin-right: 2px;`,
          onClick: () => {
            if (!props.readonly) {
              props.record?.set(props.name, i + 1);
            }
          }
        }, active ? '★' : '☆');
      });

      return h('div', { class: 'o_priority' }, stars);
    };
  }
});

export const FieldImage = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const strVal = val !== null && val !== undefined ? String(val) : '';
      const srcVal = strVal || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%2394a3b8">Image</text></svg>';

      if (props.readonly) {
        return h('img', { class: 'o_field_image o_readonly', src: srcVal, style: 'max-width: 64px; max-height: 64px; border-radius: 4px; object-fit: cover; border: 1px solid #e2e8f0;' });
      }

      return h('div', { class: 'o_field_image_container', style: 'display: flex; flex-direction: column; gap: 4px;' }, [
        h('img', { src: srcVal, style: 'max-width: 64px; max-height: 64px; border-radius: 4px; object-fit: cover; border: 1px solid #e2e8f0;' }),
        h('input', {
          type: 'file',
          accept: 'image/*',
          style: 'font-size: 10px; width: 120px;',
          onChange: (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event: any) => {
                props.record?.set(props.name, event.target.result);
              };
              reader.readAsDataURL(file);
            }
          }
        })
      ]);
    };
  }
});

export const FieldHandle = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      return h('span', {
        class: 'o_row_handle',
        style: 'cursor: grab; display: inline-block; padding: 4px; color: #94a3b8; font-size: 14px;'
      }, '☰');
    };
  }
});

export const FieldTag = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const list = Array.isArray(val) ? val : (val !== null && val !== undefined ? [val] : []);

      const pills = list.map((item: any) => {
        const label = Array.isArray(item) ? item[1] : String(item.display_name || item.name || item);
        return h('span', {
          class: 'o_tag_badge',
          style: 'display: inline-block; padding: 2px 8px; margin-right: 4px; margin-bottom: 4px; font-size: 11px; border-radius: 4px; background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;'
        }, label);
      });

      return h('div', { class: 'o_field_tags' }, pills);
    };
  }
});

export const FieldPercentage = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const percentValue = Math.round((Number(val) || 0) * 100);

      if (props.readonly) {
        return h('span', { class: 'o_field_percentage o_readonly' }, `${percentValue}%`);
      }

      return h('div', {
        class: 'o_field_percentage_input',
        style: 'display: flex; align-items: center; gap: 4px;'
      }, [
        h('input', {
          type: 'number',
          step: 'any',
          class: 'o_field_percentage',
          value: percentValue,
          onInput: (e: any) => props.record?.set(props.name, Number(e.target.value) / 100)
        }),
        h('span', null, '%')
      ]);
    };
  }
});

export function registerCoreComponents() {
  componentRegistry.add('char', FieldChar);
  componentRegistry.add('text', FieldText);
  componentRegistry.add('html', FieldHtml);
  componentRegistry.add('integer', FieldInteger);
  componentRegistry.add('float', FieldFloat);
  componentRegistry.add('monetary', FieldMonetary);
  componentRegistry.add('boolean', FieldBoolean);
  componentRegistry.add('selection', FieldSelection);
  componentRegistry.add('date', FieldDate);
  componentRegistry.add('datetime', FieldDatetime);
  componentRegistry.add('many2one', FieldMany2one);
  componentRegistry.add('one2many', FieldOne2many);
  componentRegistry.add('many2many', FieldMany2many);
  componentRegistry.add('url', FieldUrl);
  componentRegistry.add('email', FieldEmail);
  componentRegistry.add('phone', FieldPhone);
  componentRegistry.add('badge', FieldBadge);
  componentRegistry.add('progressbar', FieldProgressBar);
  componentRegistry.add('priority', FieldPriority);
  componentRegistry.add('image', FieldImage);
  componentRegistry.add('handle', FieldHandle);
  componentRegistry.add('tag', FieldTag);
  componentRegistry.add('percentage', FieldPercentage);
}

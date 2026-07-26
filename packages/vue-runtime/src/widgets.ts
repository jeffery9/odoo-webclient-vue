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

const TAG_COLORS = [
  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }, // Red
  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }, // Blue
  { bg: '#dcfce7', text: '#166534', border: '#86efac' }, // Green
  { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }, // Yellow
  { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' }, // Orange
  { bg: '#f3e8ff', text: '#6b21a8', border: '#d8b4fe' }, // Purple
  { bg: '#ccfbf1', text: '#115e59', border: '#5eead4' }, // Teal
  { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8' }, // Pink
  { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' }, // Slate
  { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' }, // Indigo
];

export const FieldTag = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    relation: { type: String, default: '' }
  },
  setup(props) {
    const inputVal = ref('');
    const showDropdown = ref(false);
    const containerRef = ref<HTMLElement | null>(null);

    const tagSuggestions = [
      'VIP Customer',
      'Services',
      'Consulting',
      'Internal',
      'Supplier',
      'SaaS Partner',
      'Odoo Expert',
    ];

    const getColor = (rec: any) => {
      const id = rec?.id || (rec?.get ? rec.get('id') : null) || (Array.isArray(rec) ? rec[0] : 0) || 0;
      return TAG_COLORS[id % TAG_COLORS.length];
    };

    const removeTag = (recToRemove: any, e: Event) => {
      e.stopPropagation();
      const val = props.record?.get(props.name) || [];
      const childRecords = Array.isArray(val) ? val : [];
      const updated = childRecords.filter((rec: any) => {
        const thisId = rec?.get ? rec.get('id') : (Array.isArray(rec) ? rec[0] : rec?.id);
        const removeId = recToRemove?.get ? recToRemove.get('id') : (Array.isArray(recToRemove) ? recToRemove[0] : recToRemove?.id);
        return thisId !== removeId;
      });
      props.record?.set(props.name, updated);
    };

    const addTag = (tagName: string) => {
      const val = props.record?.get(props.name) || [];
      const childRecords = Array.isArray(val) ? val : [];
      
      const exists = childRecords.some((rec: any) => {
        const nameVal = rec?.get 
          ? rec.get('display_name') || rec.get('name') 
          : (Array.isArray(rec) ? rec[1] : rec?.display_name || rec?.name || String(rec));
        return String(nameVal).toLowerCase() === tagName.toLowerCase();
      });
      if (exists) return;

      const newTag = {
        id: Math.floor(Math.random() * 100000) + 1,
        display_name: tagName,
        name: tagName
      };

      props.record?.set(props.name, [...childRecords, newTag]);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && inputVal.value.trim()) {
        e.preventDefault();
        addTag(inputVal.value.trim());
        inputVal.value = '';
        showDropdown.value = false;
      }
    };

    const selectSuggestion = (sug: string, e: Event) => {
      e.stopPropagation();
      addTag(sug);
      inputVal.value = '';
      showDropdown.value = false;
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
        showDropdown.value = false;
      }
    };

    const hasInstance = getCurrentInstance();
    if (hasInstance) {
      onMounted(() => {
        window.addEventListener('click', handleClickOutside);
      });
      onUnmounted(() => {
        window.removeEventListener('click', handleClickOutside);
      });
    }

    return () => {
      const val = props.record?.get(props.name) || [];
      const childRecords = Array.isArray(val) ? val : [];

      if (props.readonly) {
        return h('div', {
          class: 'o_field_tags o_readonly',
          style: 'display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 0;'
        }, childRecords.map((rec: any) => {
          const nameVal = rec?.get 
            ? rec.get('display_name') || rec.get('name') 
            : (Array.isArray(rec) ? rec[1] : rec?.display_name || rec?.name || String(rec));
          const color = getColor(rec);
          return h('span', {
            class: 'o_tag_pill',
            style: `background: ${color.bg}; color: ${color.text}; border: 1px solid ${color.border}; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500;`
          }, String(nameVal));
        }));
      }

      return h('div', {
        ref: containerRef,
        class: 'o_field_tags o_field_widget',
        style: 'position: relative; display: flex; flex-direction: column; width: 100%;'
      }, [
        h('div', {
          class: 'o_tag_container',
          style: 'display: flex; flex-wrap: wrap; gap: 4px; border: 1px solid #ccc; padding: 4px; border-radius: 4px; background: white; min-height: 34px; align-items: center; cursor: text;',
          onClick: () => { showDropdown.value = true; }
        }, [
          childRecords.map((rec: any) => {
            const nameVal = rec?.get 
              ? rec.get('display_name') || rec.get('name') 
              : (Array.isArray(rec) ? rec[1] : rec?.display_name || rec?.name || String(rec));
            const color = getColor(rec);
            return h('span', {
              class: 'o_tag_pill',
              style: `background: ${color.bg}; color: ${color.text}; border: 1px solid ${color.border}; padding: 2px 6px; border-radius: 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; font-weight: 500;`
            }, [
              h('span', null, String(nameVal)),
              h('span', {
                class: 'o_tag_close_btn',
                style: 'cursor: pointer; font-size: 10px; opacity: 0.6; hover: opacity: 1; font-weight: bold; padding: 0 2px;',
                onClick: (e: Event) => removeTag(rec, e)
              }, '×')
            ]);
          }),

          h('input', {
            type: 'text',
            class: 'o_tag_input',
            style: 'border: none; outline: none; flex-grow: 1; font-size: 13px; min-width: 60px; padding: 2px 4px; background: transparent;',
            placeholder: childRecords.length === 0 ? 'Search or type tag...' : '',
            value: inputVal.value,
            onInput: (e: any) => {
              inputVal.value = e.target.value;
              showDropdown.value = true;
            },
            onKeydown: handleKeydown,
            onFocus: () => { showDropdown.value = true; }
          })
        ]),

        showDropdown.value ? h('div', {
          class: 'o_tag_dropdown',
          style: 'position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1px solid #cbd5e1; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); z-index: 1000; max-height: 180px; overflow-y: auto;'
        }, [
          tagSuggestions
            .filter(s => {
              const alreadySelected = childRecords.some((rec: any) => {
                const nameVal = rec?.get 
                  ? rec.get('display_name') || rec.get('name') 
                  : (Array.isArray(rec) ? rec[1] : rec?.display_name || rec?.name || String(rec));
                return String(nameVal).toLowerCase() === s.toLowerCase();
              });
              const matchesKeyword = s.toLowerCase().includes(inputVal.value.toLowerCase());
              return !alreadySelected && matchesKeyword;
            })
            .map(sug => h('div', {
              class: 'o_tag_dropdown_item',
              style: 'padding: 8px 12px; font-size: 13px; cursor: pointer; color: #334155; hover: background: #f1f5f9; display: flex; align-items: center;',
              onClick: (e: Event) => selectSuggestion(sug, e)
            }, sug)),

          inputVal.value.trim() && !tagSuggestions.some(s => s.toLowerCase() === inputVal.value.trim().toLowerCase()) ? h('div', {
            class: 'o_tag_dropdown_item_create',
            style: 'padding: 8px 12px; font-size: 13px; cursor: pointer; color: #714B67; font-weight: 500; background: #faf5f8; border-top: 1px solid #f3e8ff;',
            onClick: (e: Event) => {
              addTag(inputVal.value.trim());
              inputVal.value = '';
              showDropdown.value = false;
            }
          }, `Create "${inputVal.value.trim()}"...`) : null
        ]) : null
      ]);
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
  componentRegistry.add('many2many_tags', FieldTag);
  componentRegistry.add('percentage', FieldPercentage);
}

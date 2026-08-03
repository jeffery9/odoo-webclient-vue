import { defineComponent, h, ref, watch, computed } from 'vue';
import { useOdooField } from '../composables/useOdooField.js';

export const FieldHtml = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) }
  },
  setup(props) {
    const { value, isReadonly, isInvisible } = useOdooField(props);
    const activeTab = ref<'edit' | 'preview'>('edit');
    const editorRef = ref<HTMLDivElement | null>(null);

    watch(() => value.value, (newVal) => {
      if (editorRef.value && editorRef.value.innerHTML !== newVal) {
        editorRef.value.innerHTML = newVal || '';
      }
    });

    const fields = computed(() => props.record?.model?.fields || {});

    const handleInsertPlaceholder = (fieldName: string) => {
      if (!fieldName) return;
      const placeholder = `\${object.${fieldName}}`;
      
      if (editorRef.value) {
        editorRef.value.focus();
        let inserted = false;
        try {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (editorRef.value.contains(range.commonAncestorContainer)) {
              range.deleteContents();
              const node = document.createTextNode(placeholder);
              range.insertNode(node);
              range.setStartAfter(node);
              range.setEndAfter(node);
              sel.removeAllRanges();
              sel.addRange(range);
              inserted = true;
            }
          }
        } catch (err) {}
        if (!inserted) {
          editorRef.value.innerHTML = (editorRef.value.innerHTML || '') + placeholder;
        }
        value.value = editorRef.value.innerHTML;
      } else {
        value.value = (value.value || '') + placeholder;
      }
    };

    const compiledPreview = computed(() => {
      const rawHTML = value.value || '';
      const rawJSON = props.record?.toRawJSON ? props.record.toRawJSON() : {};
      
      return rawHTML.replace(/\\?\$\{object\.([a-zA-Z0-9_]+)\}/g, (match: string, fieldName: string) => {
        if (fieldName in rawJSON) {
          const val = rawJSON[fieldName];
          return val !== null && val !== undefined ? String(val) : '';
        }
        return '';
      });
    });

    return () => {
      if (isInvisible.value) {
        return null;
      }

      const strVal = value.value !== null && value.value !== undefined ? String(value.value) : '';

      return h('div', {
        class: 'o_field_html o_template_editor_container',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '12px',
          backgroundColor: '#ffffff'
        }
      }, [
        h('div', {
          class: 'o_template_editor_header',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '8px',
            flexWrap: 'wrap'
          }
        }, [
          h('button', {
            type: 'button',
            style: {
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid #714B67',
              backgroundColor: activeTab.value === 'edit' ? '#714B67' : 'transparent',
              color: activeTab.value === 'edit' ? '#ffffff' : '#714B67',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px'
            },
            onClick: () => { activeTab.value = 'edit'; }
          }, 'Visual Edit'),
          h('button', {
            type: 'button',
            style: {
              padding: '4px 12px',
              borderRadius: '4px',
              border: '1px solid #714B67',
              backgroundColor: activeTab.value === 'preview' ? '#714B67' : 'transparent',
              color: activeTab.value === 'preview' ? '#ffffff' : '#714B67',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px'
            },
            onClick: () => { activeTab.value = 'preview'; }
          }, 'Live QWeb Preview'),
          
          activeTab.value === 'edit' && !isReadonly.value ? h('select', {
            style: {
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              color: '#334155',
              marginLeft: 'auto'
            },
            onChange: (e: any) => {
              const selectedField = e.target.value;
              if (selectedField) {
                handleInsertPlaceholder(selectedField);
                e.target.value = '';
              }
            }
          }, [
            h('option', { value: '' }, 'Insert Placeholder...'),
            ...Object.keys(fields.value).map(f => {
              const fieldString = fields.value[f]?.string || f;
              return h('option', { value: f }, `${fieldString} (${f})`);
            })
          ]) : null
        ]),

        activeTab.value === 'edit'
          ? h('div', {
              ref: (el: any) => {
                if (el) {
                  editorRef.value = el;
                  if (el.innerHTML !== strVal) {
                    el.innerHTML = strVal;
                  }
                }
              },
              class: 'o_field_html o_template_editor_content',
              contenteditable: !isReadonly.value,
              style: {
                border: '1px solid #cbd5e1',
                padding: '12px',
                minHeight: '120px',
                borderRadius: '4px',
                backgroundColor: isReadonly.value ? '#f8fafc' : '#ffffff',
                color: '#334155',
                outline: 'none',
                fontFamily: 'monospace, Courier New, monospace',
                fontSize: '14px',
                lineHeight: '1.5'
              },
              onInput: (e: any) => {
                value.value = e.target.innerHTML;
              },
              onBlur: (e: any) => {
                value.value = e.target.innerHTML;
              }
            })
          : h('div', {
              class: 'o_template_editor_preview',
              style: {
                border: '1px solid #cbd5e1',
                padding: '12px',
                minHeight: '120px',
                borderRadius: '4px',
                backgroundColor: '#f8fafc',
                color: '#334155',
                overflow: 'auto',
                fontSize: '14px',
                lineHeight: '1.5'
              },
              innerHTML: compiledPreview.value
            })
      ]);
    }
  }
});

import { defineComponent, h, ref, watch, computed } from 'vue';
import { useOdooField } from '../composables/useOdooField.js';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { StarterKit } from '@tiptap/starter-kit';

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

    const editor = useEditor({
      content: value.value || '',
      extensions: [
        StarterKit,
      ],
      editable: !isReadonly.value,
      onUpdate: ({ editor: currentEditor }) => {
        value.value = currentEditor.getHTML();
      }
    });

    watch(() => value.value, (newVal) => {
      if (editor.value && editor.value.getHTML() !== newVal) {
        editor.value.commands.setContent(newVal || '');
      }
    });

    watch(() => isReadonly.value, (readonly) => {
      editor.value?.setEditable(!readonly);
    });

    const fields = computed(() => props.record?.model?.fields || {});

    const handleInsertPlaceholder = (fieldName: string) => {
      if (!fieldName) return;
      const placeholder = `\${object.${fieldName}}`;
      editor.value?.commands.insertContent(placeholder);
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

      // Formatting Toolbar Button Helper
      const renderToolbarBtn = (label: string, action: () => void, isActive: boolean) => {
        return h('button', {
          type: 'button',
          onClick: action,
          style: {
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            backgroundColor: isActive ? '#714B67' : '#ffffff',
            color: isActive ? '#ffffff' : '#475569',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '11px',
            transition: 'all 0.15s ease'
          }
        }, label);
      };

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

        // Render Toolbar only in edit tab and edit mode
        activeTab.value === 'edit' && !isReadonly.value && editor.value
          ? h('div', {
              class: 'o_template_editor_toolbar',
              style: {
                display: 'flex',
                gap: '4px',
                paddingBottom: '4px',
                borderBottom: '1px dashed #e2e8f0',
                flexWrap: 'wrap'
              }
            }, [
              renderToolbarBtn('B', () => editor.value?.chain().focus().toggleBold().run(), !!editor.value?.isActive('bold')),
              renderToolbarBtn('I', () => editor.value?.chain().focus().toggleItalic().run(), !!editor.value?.isActive('italic')),
              renderToolbarBtn('S', () => editor.value?.chain().focus().toggleStrike().run(), !!editor.value?.isActive('strike')),
              renderToolbarBtn('Code', () => editor.value?.chain().focus().toggleCode().run(), !!editor.value?.isActive('code')),
              renderToolbarBtn('• List', () => editor.value?.chain().focus().toggleBulletList().run(), !!editor.value?.isActive('bulletList')),
              renderToolbarBtn('1. List', () => editor.value?.chain().focus().toggleOrderedList().run(), !!editor.value?.isActive('orderedList')),
              h('button', {
                type: 'button',
                onClick: () => editor.value?.chain().focus().clearContent().run(),
                style: {
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '11px',
                  marginLeft: 'auto'
                }
              }, 'Clear')
            ])
          : null,

        activeTab.value === 'edit'
          ? h('div', {
              class: 'o_field_html o_template_editor_content_wrapper',
              style: {
                border: '1px solid #cbd5e1',
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: isReadonly.value ? '#f8fafc' : '#ffffff',
                minHeight: '120px'
              }
            }, [
              h(EditorContent, {
                editor: editor.value,
                class: 'o_template_editor_content tiptap_canvas',
                style: {
                  outline: 'none',
                  minHeight: '112px',
                  padding: '8px',
                  color: '#334155',
                  fontFamily: 'monospace, Courier New, monospace',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }
              })
            ])
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
    };
  }
});

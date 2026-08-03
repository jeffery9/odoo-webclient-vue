import { defineComponent, h, ref, getCurrentInstance, onMounted, onUnmounted, computed } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

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
    const isLoading = ref(false);
    const tagSuggestions = ref<{ id: number; display_name: string }[]>([]);

    const childRecords = computed(() => {
      const val = props.record?.get(props.name) || [];
      return Array.isArray(val) ? val : [];
    });

    const selectedIds = computed(() => {
      return childRecords.value.map((rec: any) => {
        return rec?.get ? rec.get('id') : (Array.isArray(rec) ? rec[0] : rec?.id);
      });
    });

    const search = async (q: string) => {
      const session = props.record?.model?.session;
      if (session?.rpc) {
        isLoading.value = true;
        try {
          const relationModel = props.relation || 'res.partner.category';
          const res = await session.rpc({
            model: relationModel,
            method: 'search_read',
            args: [[['name', 'ilike', q]], ['name', 'display_name']]
          });
          if (Array.isArray(res)) {
            tagSuggestions.value = res.map((r: any) => ({
              id: r.id,
              display_name: r.display_name || r.name || ''
            }));
          }
        } catch (e) {
          // fallback silently for standalone runs
        } finally {
          isLoading.value = false;
        }
      }
    };

    const getColor = (rec: any) => {
      const id = rec?.id || (rec?.get ? rec.get('id') : null) || (Array.isArray(rec) ? rec[0] : 0) || 0;
      return TAG_COLORS[id % TAG_COLORS.length];
    };

    onMounted(() => {
      search('');
    });

    return () => {
      if (props.readonly) {
        return h('div', {
          class: 'o_field_tags o_readonly',
          style: 'display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 0;'
        }, childRecords.value.map((rec: any) => {
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
        class: 'o_field_tags o_field_widget',
        style: {
          '--el-color-primary': '#714B67',
          '--el-color-primary-light-9': '#f3eff2',
          '--el-border-radius-base': '6px',
          width: '100%',
          display: 'inline-block'
        }
      }, [
        h(ElSelect, {
          modelValue: selectedIds.value,
          multiple: true,
          filterable: true,
          remote: true,
          allowCreate: true,
          defaultFirstOption: true,
          placeholder: childRecords.value.length === 0 ? 'Search or create tag...' : '',
          loading: isLoading.value,
          remoteMethod: search,
          style: { width: '100%' },
          class: 'o_field_many2many_tags_select',
          'onUpdate:modelValue': (newIds: any[]) => {
            const updated = newIds.map((idVal) => {
              if (typeof idVal === 'string') {
                // Created on the fly!
                return {
                  id: Math.floor(Math.random() * 100000) + 1,
                  display_name: idVal,
                  name: idVal
                };
              }
              const found = childRecords.value.find((rec: any) => {
                const rId = rec?.get ? rec.get('id') : (Array.isArray(rec) ? rec[0] : rec?.id);
                return rId === idVal;
              });
              if (found) return found;
              const suggestion = tagSuggestions.value.find(sug => sug.id === idVal);
              return suggestion || { id: idVal, display_name: String(idVal), name: String(idVal) };
            });
            props.record?.set(props.name, updated);
          }
        }, () => [
          ...tagSuggestions.value.map(s => h(ElOption, {
            key: s.id,
            label: s.display_name,
            value: s.id
          }))
        ])
      ]);
    };
  }
});

export const FieldAvatar = defineComponent({
  name: 'FieldAvatar',
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    const getInitials = (name: string) => {
      if (!name) return '?';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    };

    const getAvatarBg = (idVal: any, nameVal: string) => {
      const stringToHash = String(idVal || nameVal || '');
      let hash = 0;
      for (let i = 0; i < stringToHash.length; i++) {
        hash = stringToHash.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colorIndex = Math.abs(hash) % TAG_COLORS.length;
      return TAG_COLORS[colorIndex];
    };

    return () => {
      const val = props.record?.get(props.name);
      
      const id = Array.isArray(val) ? val[0] : (val?.id || 0);
      const displayName = Array.isArray(val) ? val[1] : (val?.display_name || val?.name || String(val || ''));

      if (!displayName) {
        return h('div', {
          class: 'o_avatar_placeholder',
          style: 'width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; color: #94a3b8; border: 1px solid #cbd5e1;'
        }, '👤');
      }

      const isBase64 = typeof val === 'string' && val.startsWith('data:image');
      const isUrl = typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'));

      if (isBase64 || isUrl) {
        return h('img', {
          class: 'o_field_avatar',
          src: val,
          alt: displayName,
          style: 'width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1; display: inline-block;'
        });
      }

      const initials = getInitials(displayName);
      const color = getAvatarBg(id, displayName);

      return h('div', {
        class: 'o_field_avatar o_avatar_initials',
        title: displayName,
        style: `width: 32px; height: 32px; border-radius: 50%; background: ${color.bg}; color: ${color.text}; border: 1px solid ${color.border}; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; cursor: default;`
      }, initials);
    };
  }
});

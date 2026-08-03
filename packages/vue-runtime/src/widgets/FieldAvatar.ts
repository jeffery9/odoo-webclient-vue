import { defineComponent, h } from 'vue';
import { TAG_COLORS } from './tagColors.js';

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

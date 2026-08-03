import { defineComponent, h } from 'vue';

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

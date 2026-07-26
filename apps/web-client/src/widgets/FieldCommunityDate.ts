import { defineComponent, h } from 'vue';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

export const FieldCommunityDate = defineComponent({
  name: 'FieldCommunityDate',
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      // Convert Odoo date string into standard JS Date object for the community picker
      const dateVal = val ? new Date(val) : null;

      if (props.readonly) {
        const strVal = val ? String(val).split(' ')[0] : '';
        return h('span', { class: 'o_field_date o_readonly' }, strVal);
      }

      // Render the community DatePicker seamlessly
      return h(VueDatePicker, {
        modelValue: dateVal,
        enableTimePicker: false,
        autoPosition: true,
        textInput: true,
        format: 'yyyy-MM-dd',
        'onUpdate:modelValue': (newVal: any) => {
          if (newVal instanceof Date && !isNaN(newVal.getTime())) {
            const yyyy = newVal.getFullYear();
            const mm = String(newVal.getMonth() + 1).padStart(2, '0');
            const dd = String(newVal.getDate()).padStart(2, '0');
            props.record?.set(props.name, `${yyyy}-${mm}-${dd}`);
          } else if (!newVal) {
            props.record?.set(props.name, null);
          }
        }
      });
    };
  }
});

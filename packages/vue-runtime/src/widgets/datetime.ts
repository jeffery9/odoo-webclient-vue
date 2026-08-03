import { defineComponent, h, computed } from 'vue';
import { useOdooField } from '../composables/useOdooField.js';
import { ElDatePicker } from 'element-plus';
import 'element-plus/dist/index.css';

export const FieldDate = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) }
  },
  setup(props) {
    const { value, isReadonly, isInvisible } = useOdooField(props);

    const formattedValue = computed(() => {
      const val = value.value;
      if (!val) return '';
      return String(val).split(' ')[0];
    });

    const formatDate = (val: any): string => {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return () => {
      if (isInvisible.value) return null;

      if (isReadonly.value) {
        return h('span', { class: 'o_field_date o_readonly', style: { color: '#475569', fontSize: '13px' } }, formattedValue.value);
      }

      return h('div', {
        class: 'o_field_date_wrapper',
        style: {
          '--el-color-primary': '#714B67',
          '--el-color-primary-light-9': '#f3eff2',
          '--el-border-radius-base': '6px',
          width: '100%',
          display: 'inline-block'
        }
      }, [
        h(ElDatePicker, {
          modelValue: formattedValue.value ? new Date(formattedValue.value) : null,
          type: 'date',
          placeholder: 'Select date',
          format: 'YYYY-MM-DD',
          style: { width: '100%' },
          class: 'o_field_date',
          'onUpdate:modelValue': (newVal: any) => {
            value.value = formatDate(newVal);
          }
        })
      ]);
    };
  }
});

export const FieldDatetime = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) }
  },
  setup(props) {
    const { value, isReadonly, isInvisible } = useOdooField(props);

    const formattedValue = computed(() => {
      const val = value.value;
      if (!val) return '';
      return String(val).replace(' ', 'T');
    });

    const formatDatetime = (val: any): string => {
      if (!val) return '';
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    return () => {
      if (isInvisible.value) return null;

      if (isReadonly.value) {
        return h('span', { class: 'o_field_datetime o_readonly', style: { color: '#475569', fontSize: '13px' } }, formattedValue.value.replace('T', ' '));
      }

      return h('div', {
        class: 'o_field_datetime_wrapper',
        style: {
          '--el-color-primary': '#714B67',
          '--el-color-primary-light-9': '#f3eff2',
          '--el-border-radius-base': '6px',
          width: '100%',
          display: 'inline-block'
        }
      }, [
        h(ElDatePicker, {
          modelValue: formattedValue.value ? new Date(formattedValue.value) : null,
          type: 'datetime',
          placeholder: 'Select date & time',
          format: 'YYYY-MM-DD HH:mm:ss',
          style: { width: '100%' },
          class: 'o_field_datetime',
          'onUpdate:modelValue': (newVal: any) => {
            value.value = formatDatetime(newVal);
          }
        })
      ]);
    };
  }
});

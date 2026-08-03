import { defineComponent, h } from 'vue';

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
    readonly: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) }
  },
  setup(props) {
    return () => {
      const val = props.record?.get(props.name);
      const numVal = typeof val === 'number' ? val : 0.0;

      const currencyField = props.options?.currency_field || 'currency_id';
      const currencyVal = props.record?.get(currencyField);
      const currencyId = Array.isArray(currencyVal) ? currencyVal[0] : (typeof currencyVal === 'number' ? currencyVal : null);

      const session = props.record?.model?.session;
      const currency = session?.currencies?.[currencyId || ''] || session?.currencies?.[session?.companyId || ''] || { symbol: '$', position: 'before' };

      if (props.readonly) {
        const lang = (session?.userContext?.lang || 'en-US').replace('_', '-');
        const formatted = new Intl.NumberFormat(lang, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(numVal);

        const displayStr = currency.position === 'before' ? `${currency.symbol}${formatted}` : `${formatted} ${currency.symbol}`;
        return h('span', { class: 'o_field_monetary o_readonly font-semibold', style: { color: '#714B67', fontSize: '13px' } }, displayStr);
      }

      const symbolSpan = h('span', {
        class: 'o_monetary_symbol text-slate-400 font-medium px-2 py-1 bg-slate-50 border border-slate-200 rounded',
        style: 'display: inline-flex; align-items: center; justify-content: center; font-size: 13px;'
      }, currency.symbol);

      const inputNode = h('input', {
        type: 'number',
        step: 'any',
        class: 'o_field_number flex-grow border border-slate-200 rounded px-2 py-1 outline-none',
        style: 'font-size: 13px; max-width: 140px;',
        value: numVal,
        onInput: (e: any) => props.record?.set(props.name, Number(e.target.value))
      });

      return h('div', {
        class: 'o_field_monetary o_field_widget flex items-center gap-1 w-full'
      }, currency.position === 'before' ? [symbolSpan, inputNode] : [inputNode, symbolSpan]);
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

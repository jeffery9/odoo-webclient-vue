import { defineComponent, h, ref, watch } from 'vue';
import { useOdooRelationField } from '../composables/useOdooRelationField.js';

export const FieldMany2one = defineComponent({
  props: {
    record: { type: Object, required: true },
    name: { type: String, required: true },
    readonly: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) },
    context: { type: Object, default: () => ({}) }
  },
  setup(props) {
    const {
      value,
      isReadonly,
      isInvisible,
      suggestions,
      isLoading,
      search,
      select,
      openRelationForm
    } = useOdooRelationField(props);

    const isOpen = ref(false);
    const query = ref('');

    watch(
      () => value.value,
      (newVal) => {
        if (Array.isArray(newVal)) {
          query.value = newVal[1] || '';
        } else {
          query.value = '';
        }
      },
      { immediate: true }
    );

    const onInput = (e: any) => {
      query.value = e.target.value;
      isOpen.value = true;
      search(e.target.value);
    };

    const onFocus = () => {
      isOpen.value = true;
      search(query.value);
    };

    const onBlur = () => {
      setTimeout(() => {
        isOpen.value = false;
      }, 200);
    };

    return () => {
      if (isInvisible.value) {
        return null;
      }

      const val = value.value;
      const id = Array.isArray(val) ? val[0] : null;
      const name = Array.isArray(val) ? val[1] : '';

      if (isReadonly.value) {
        if (id !== null && id !== undefined && id !== false) {
          return h(
            'a',
            {
              class: 'o_field_many2one o_readonly text-purple-600 hover:underline cursor-pointer font-medium',
              onClick: () => openRelationForm(id)
            },
            name
          );
        }
        return h('span', { class: 'o_field_many2one o_readonly text-slate-400 font-light' }, '—');
      }

      return h('div', { class: 'o_field_many2one o_field_widget relative' }, [
        h('div', { class: 'relative flex items-center' }, [
          h('input', {
            class: 'o_input w-full pr-8 py-1 px-2 border border-slate-300 rounded focus:outline-none focus:border-purple-600',
            value: query.value,
            placeholder: 'Search...',
            onInput,
            onFocus,
            onBlur
          }),
          isLoading.value
            ? h('div', { class: 'absolute right-2 flex items-center justify-center' }, [
                h('span', { class: 'o_spinner animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full' })
              ])
            : null
        ]),
        isOpen.value
          ? h(
              'div',
              {
                class: 'o_dropdown absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-60 overflow-y-auto'
              },
              [
                ...suggestions.value.map((sug) =>
                  h(
                    'div',
                    {
                      class: 'o_dropdown_item px-3 py-2 hover:bg-slate-100 cursor-pointer text-slate-700 text-sm transition-colors duration-150',
                      onMousedown: () => {
                        select(sug.id, sug.display_name);
                        isOpen.value = false;
                      }
                    },
                    sug.display_name
                  )
                ),
                h(
                  'div',
                  {
                    class: 'o_dropdown_item_create border-t border-slate-100 px-3 py-2 hover:bg-purple-50 cursor-pointer text-purple-600 font-medium text-sm transition-colors duration-150',
                    onMousedown: () => {
                      openRelationForm();
                      isOpen.value = false;
                    }
                  },
                  '+ Create and Edit...'
                )
              ]
            )
          : null
      ]);
    };
  }
});

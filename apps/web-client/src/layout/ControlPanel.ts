import { h } from 'vue';
import { activeMenu, activeMenuName } from './state.js';

export const ControlPanel = {
  name: 'ControlPanel',
  props: {
    activeViewType: { type: String, required: true },
    selectedRecord: { type: Object, default: null },
    readonlyMode: { type: Boolean, required: true },
    searchQuery: { type: String, required: true },
    currentOffset: { type: Number, required: true },
    currentLimit: { type: Number, required: true },
    totalRecordsCount: { type: Number, required: true },
    onPageNext: { type: Function, required: true },
    onPagePrev: { type: Function, required: true },
    onSearchInput: { type: Function, required: true },
    onCreate: { type: Function, required: true },
    onToggleEdit: { type: Function, required: true },
    onSaveChanges: { type: Function, required: true },
    onDiscardChanges: { type: Function, required: true },
    onBackToList: { type: Function, required: true },
    onSetViewType: { type: Function, required: true }
  },
  setup(props: any) {
    return () => h('div', { class: 'o_control_panel' }, [
      h('div', { class: 'o_cp_left' }, [
        h('div', { class: 'o_breadcrumb' }, [
          h('span', { class: 'o_breadcrumb_link', onClick: props.onBackToList }, activeMenu.value?.name),
          h('span', { class: 'o_breadcrumb_separator' }, '/'),
          h('span', null, props.activeViewType === 'form' && props.selectedRecord ? (props.selectedRecord.get('name') || props.selectedRecord.get('display_name')) : activeMenuName.value)
        ]),
        h('div', { class: 'o_cp_buttons' }, [
          props.activeViewType !== 'form'
            ? h('button', { class: 'o_btn_primary', onClick: props.onCreate }, 'New')
            : h('div', { style: 'display: flex; gap: 8px;' }, [
                props.readonlyMode
                  ? h('button', { class: 'o_btn_primary', onClick: props.onToggleEdit }, 'Edit')
                  : h('button', { class: 'o_btn_primary', onClick: props.onSaveChanges }, 'Save'),
                !props.readonlyMode
                  ? h('button', { class: 'o_btn_secondary', onClick: props.onDiscardChanges }, 'Discard')
                  : h('button', { class: 'o_btn_secondary', onClick: props.onBackToList }, 'Back to List')
              ])
        ])
      ]),

      h('div', { class: 'o_cp_right' }, [
        h('div', { style: 'display: flex; gap: 16px; align-items: center;' }, [
          props.activeViewType !== 'form' ? h('div', { class: 'o_pager' }, [
            h('span', { class: 'o_pager_value' }, `${props.currentOffset + 1}-${Math.min(props.currentOffset + props.currentLimit, props.totalRecordsCount)}`),
            h('span', null, '/'),
            h('span', null, props.totalRecordsCount),
            h('button', { class: 'o_pager_btn', disabled: props.currentOffset === 0, onClick: props.onPagePrev }, '‹'),
            h('button', { class: 'o_pager_btn', disabled: props.currentOffset + props.currentLimit >= props.totalRecordsCount, onClick: props.onPageNext }, '›')
          ]) : null,

          props.activeViewType !== 'form' ? h('div', { class: 'o_cp_searchview' }, [
            h('span', null, '🔍'),
            h('input', {
              class: 'o_cp_searchview_input',
              placeholder: `Search ${activeMenu.value?.name || 'Records'}...`,
              value: props.searchQuery,
              onInput: (e: any) => props.onSearchInput(e.target.value)
            })
          ]) : null,

          h('div', { class: 'o_cp_switch_buttons' }, [
            h('button', { class: ['o_switch_btn', props.activeViewType === 'list' ? 'active' : ''], onClick: () => props.onSetViewType('list') }, 'List ☰'),
            h('button', { class: ['o_switch_btn', props.activeViewType === 'kanban' ? 'active' : ''], onClick: () => props.onSetViewType('kanban') }, 'Kanban ⚃'),
            h('button', { class: ['o_switch_btn', props.activeViewType === 'form' ? 'active' : ''], disabled: !props.selectedRecord, onClick: () => props.onSetViewType('form') }, 'Form ▭')
          ])
        ])
      ])
    ]);
  }
};

import { h } from 'vue';
import {
  isAuthenticated,
  isConnecting,
  isDevMode,
  hostUrl,
  dbName,
  username,
  password,
  persistSettings,
} from './state.js';

export const LoginPortal = {
  name: 'LoginPortal',
  props: {
    onConnect: { type: Function, required: true },
  },
  setup(props: { onConnect: () => Promise<void> }) {
    return () => !isAuthenticated.value ? h('div', { class: 'o_modal_overlay' }, [
      h('div', { class: 'o_modal_box' }, [
        h('div', { style: 'display: flex; justify-content: space-between; align-items: center;' }, [
          h('h3', { class: 'o_modal_title' }, 'Odoo Enterprise Connect'),
          h('button', {
            class: ['o_filter_btn', isDevMode.value ? 'active' : ''],
            onClick: () => { isDevMode.value = !isDevMode.value; persistSettings(); }
          }, 'Dev Settings')
        ]),

        isDevMode.value ? h('div', null, [
          h('div', { class: 'o_modal_field', style: 'margin-bottom: 12px;' }, [
            h('label', { class: 'o_modal_label' }, 'Server Endpoint'),
            h('input', { class: 'o_modal_input', value: hostUrl.value, onInput: (e: any) => { hostUrl.value = e.target.value; persistSettings(); } })
          ]),
          h('div', { class: 'o_modal_field', style: 'margin-bottom: 12px;' }, [
            h('label', { class: 'o_modal_label' }, 'Database'),
            h('input', { class: 'o_modal_input', value: dbName.value, onInput: (e: any) => { dbName.value = e.target.value; persistSettings(); } })
          ])
        ]) : null,

        h('div', { class: 'o_modal_field' }, [
          h('label', { class: 'o_modal_label' }, 'Username / Email'),
          h('input', { class: 'o_modal_input', value: username.value, onInput: (e: any) => { username.value = e.target.value; persistSettings(); } })
        ]),
        h('div', { class: 'o_modal_field', style: 'margin-top: 12px;' }, [
          h('label', { class: 'o_modal_label' }, 'Password'),
          h('input', { type: 'password', class: 'o_modal_input', value: password.value, onInput: (e: any) => { password.value = e.target.value; persistSettings(); } })
        ]),
        h('div', { style: 'display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;' }, [
          h('button', {
            class: 'o_btn_primary',
            disabled: isConnecting.value,
            onClick: props.onConnect
          }, isConnecting.value ? 'Authenticating...' : 'Sign In & Sync')
        ])
      ])
    ]) : null;
  }
};

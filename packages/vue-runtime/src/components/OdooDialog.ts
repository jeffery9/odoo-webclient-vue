import { h, defineComponent, reactive, ref, computed } from 'vue';

export interface OdooDialogConfig {
  id: string;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  component: any; // Can be a component class or render function
  props?: Record<string, any>;
  onClose?: () => void;
  onConfirm?: (data?: any) => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

// Centrally managed active dialogs stack (supports nested modals/stacked wizards)
export const activeDialogs = reactive<OdooDialogConfig[]>([]);

export const dialogService = {
  open(config: OdooDialogConfig) {
    if (!config.id) {
      config.id = `dialog_${Math.random().toString(36).substr(2, 9)}`;
    }
    activeDialogs.push(config);
    return config.id;
  },
  close(id: string) {
    const idx = activeDialogs.findIndex(d => d.id === id);
    if (idx !== -1) {
      const [dialog] = activeDialogs.splice(idx, 1);
      if (dialog.onClose) dialog.onClose();
    }
  },
  closeTop() {
    const dialog = activeDialogs.pop();
    if (dialog && dialog.onClose) dialog.onClose();
  },
  clearAll() {
    activeDialogs.forEach(d => { if (d.onClose) d.onClose(); });
    activeDialogs.splice(0, activeDialogs.length);
  }
};

// Standard Odoo Pop-up Modal Card Wrapper
export const OdooDialog = defineComponent({
  name: 'OdooDialog',
  props: {
    config: { type: Object, required: true }
  },
  setup(props) {
    const widthMap = {
      sm: 'max-width: 400px; width: 90%;',
      md: 'max-width: 600px; width: 90%;',
      lg: 'max-width: 900px; width: 90%;',
      xl: 'max-width: 1200px; width: 95%;'
    };

    const handleClose = () => {
      dialogService.close(props.config.id);
    };

    const handleConfirm = () => {
      if (props.config.onConfirm) {
        props.config.onConfirm();
      }
      handleClose();
    };

    return () => {
      const { title, size = 'md', component, props: compProps = {}, confirmLabel = '保存并关闭', cancelLabel = '丢弃' } = props.config;
      const sizeStyle = widthMap[size as keyof typeof widthMap] || widthMap.md;

      return h('div', {
        class: 'o_dialog_mask fixed inset-0 flex items-center justify-center',
        style: 'background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 1000;',
        onClick: (e: MouseEvent) => {
          if (e.target === e.currentTarget) handleClose();
        }
      }, [
        h('div', {
          class: 'o_dialog_container bg-white rounded-xl shadow-2xl flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150',
          style: sizeStyle + ' max-height: 85vh; min-height: 200px;'
        }, [
          // 1. Dialog Header
          h('div', {
            class: 'o_dialog_header px-6 py-4 border-b border-slate-100 flex items-center justify-between'
          }, [
            h('span', { class: 'text-base font-bold text-slate-800' }, title),
            h('button', {
              class: 'text-slate-400 hover:text-slate-600 transition-colors cursor-pointer',
              onClick: handleClose
            }, [
              h('i', { class: 'fa fa-times', style: 'font-size: 16px;' })
            ])
          ]),

          // 2. Dialog Body (Scrollable container)
          h('div', {
            class: 'o_dialog_body px-6 py-5 overflow-y-auto flex-1'
          }, [
            h(component, {
              ...compProps,
              onClose: handleClose,
              onConfirm: handleConfirm
            })
          ]),

          // 3. Dialog Footer
          h('div', {
            class: 'o_dialog_footer px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl'
          }, [
            // Discard Button
            h('button', {
              class: 'px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer',
              onClick: handleClose
            }, cancelLabel),
            
            // Confirm Button
            h('button', {
              class: 'px-4 py-2 bg-[#714B67] hover:bg-[#5f3b55] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5',
              onClick: handleConfirm
            }, [
              h('i', { class: 'fa fa-check' }),
              confirmLabel
            ])
          ])
        ])
      ]);
    };
  }
});

// Portal Outlet to Mount Stacked Dialogs
export const OdooDialogOutlet = defineComponent({
  name: 'OdooDialogOutlet',
  setup() {
    return () => {
      if (activeDialogs.length === 0) return null;
      
      return h('div', {
        class: 'o_dialog_outlet'
      }, activeDialogs.map((d) => h(OdooDialog, {
        key: d.id,
        config: d
      })));
    };
  }
});

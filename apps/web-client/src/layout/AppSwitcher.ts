import { defineComponent, h } from 'vue';

export const AppSwitcher = defineComponent({
  name: 'AppSwitcher',
  props: {
    menus: { type: Array, required: true },
    onSelect: { type: Function, required: true }
  },
  setup(props) {
    // Generate a unique beautiful background gradient based on the app name length or letters
    const getAppGradient = (name: string): string => {
      const colors = [
        ['#714B67', '#8e5d81'], // Odoo Purple
        ['#01A299', '#02c7b5'], // Odoo Teal
        ['#20639B', '#3c8cd3'], // Royal Blue
        ['#3CAEA3', '#5ed2c7'], // Mint Green
        ['#F6D55C', '#fbe087'], // Sunny Yellow
        ['#ED553B', '#f27f6e'], // Warm Orange
        ['#1e293b', '#475569'], // Charcoal Slate
        ['#15803d', '#22c55e']  // Emerald
      ];
      
      const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const index = charCodeSum % colors.length;
      const [start, stop] = colors[index];
      return `linear-gradient(135deg, ${start} 0%, ${stop} 100%)`;
    };

    return () => h('div', {
      class: 'o_home_menu',
      style: 'flex-grow: 1; background: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 60px 24px; overflow-y: auto; color: white; width: 100%; height: 100%; box-sizing: border-box;'
    }, [
      // Title / Greeting Section (Odoo EE Style)
      h('div', {
        style: 'text-align: center; margin-bottom: 48px; max-width: 600px; width: 100%;'
      }, [
        h('h1', {
          style: 'font-size: 28px; font-weight: 500; color: #f8fafc; margin: 0 0 8px 0; font-family: system-ui, sans-serif;'
        }, 'Odoo Enterprise Home Menu'),
        h('p', {
          style: 'font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5;'
        }, 'Select an application below to begin workspace operations. Press the waffle icon in the top left corner at any time to return here.')
      ]),

      // CSS Grid of Apps
      h('div', {
        style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 24px; max-width: 960px; width: 100%;'
      }, props.menus.map((m: any) => {
        const gradient = getAppGradient(m.name);
        const initialLetter = m.name.substring(0, 1).toUpperCase();

        return h('div', {
          class: 'o_app_icon_container',
          style: 'display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s ease, opacity 0.2s ease;',
          onClick: () => props.onSelect(m)
        }, [
          // Styled Icon Circle
          h('div', {
            class: 'o_app_icon',
            style: `width: 72px; height: 72px; border-radius: 16px; background: ${gradient}; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 600; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.2); margin-bottom: 12px; transition: box-shadow 0.2s, transform 0.2s;`
          }, initialLetter),
          
          // App Title Text
          h('div', {
            style: 'font-size: 13px; font-weight: 500; text-align: center; color: #e2e8f0; max-width: 100px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
            title: m.name
          }, m.name)
        ]);
      }))
    ]);
  }
});

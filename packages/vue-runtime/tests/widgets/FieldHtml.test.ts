import { describe, test, expect } from 'vitest';
import { componentRegistry } from '../../src/registry.js';
import { FieldHtml } from '../../src/widgets/FieldHtml.js';
import { RecordProxy } from '@odoo/sdk';

componentRegistry.add('html', FieldHtml);

describe('FieldHtml Widget', () => {
  test('should render FieldHtml and test WYSIWYG QWeb editor features', () => {
    // 1. Setup record with mock model fields
    const record = new RecordProxy('res.partner', {
      note: 'Hello ${object.name} from ${object.city}!',
      name: 'Mitchell Admin',
      city: 'Brussels'
    });
    
    // Stub the model structure for dropdown template options list
    (record as any).model = {
      fields: {
        name: { string: 'Partner Name' },
        city: { string: 'City' }
      }
    };

    const widget = componentRegistry.get('html') as any;

    // 2. Setup widget with setup()
    const renderFn = widget.setup({ record, name: 'note', readonly: false }, {});
    
    // Call render once - it should render in 'edit' tab by default
    let vnode = renderFn();

    // Verify visual container structure
    expect(vnode.type).toBe('div');
    expect(vnode.props.class).toBe('o_field_html o_template_editor_container');

    // Header div should be the first child
    const header = vnode.children[0];
    expect(header.type).toBe('div');
    expect(header.props.class).toBe('o_template_editor_header');

    // Inside header we should have buttons and the placeholder select
    const visualEditBtn = header.children[0];
    const previewBtn = header.children[1];
    const selectDropdown = header.children[2];

    expect(visualEditBtn.children).toBe('Visual Edit');
    expect(previewBtn.children).toBe('Live QWeb Preview');
    expect(selectDropdown.type).toBe('select');

    // Editor content div should be the second child
    const editorContent = vnode.children[1];
    expect(editorContent.type).toBe('div');
    expect(editorContent.props.class).toBe('o_field_html o_template_editor_content');
    expect(editorContent.props.contenteditable).toBe(true);

    // 3. Test dynamic dropdown template insertion
    // Simulate onChange event of select dropdown
    const fakeEvent = { target: { value: 'name' } };
    selectDropdown.props.onChange(fakeEvent);

    // After calling handleInsertPlaceholder inside onChange, the value should be updated
    // with the placeholder appended or inserted
    expect(record.get('note')).toContain('${object.name}');

    // 4. Test live QWeb preview rendering compilation
    // Switch tab to 'preview' by triggering the Live QWeb Preview button onClick
    previewBtn.props.onClick();

    // Re-render and get updated VNode structure in preview tab
    vnode = renderFn();

    // The second child should now be the preview container (not edit container)
    const previewContainer = vnode.children[1];
    expect(previewContainer.type).toBe('div');
    expect(previewContainer.props.class).toBe('o_template_editor_preview');

    // Preview innerHTML should have compiled placeholders with actual record values:
    // "Mitchell Admin" for ${object.name}, "Brussels" for ${object.city}
    expect(previewContainer.props.innerHTML).toContain('Mitchell Admin');
    expect(previewContainer.props.innerHTML).toContain('Brussels');
  });
});

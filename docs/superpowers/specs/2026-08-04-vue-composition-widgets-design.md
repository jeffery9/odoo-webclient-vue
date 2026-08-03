# 🌌 Specification: Composition-Based Vue Components & Hooks Architecture for Odoo Client

**Date**: 2026-08-04  
**Author**: Gemini CLI & Odoo Architecture Sentry  
**Status**: APPROVED  
**Core Paradigm**: Approach 1 — Pure Hook-Driven Composition Pattern (组合模式)

---

## 1. Executive Summary & Design Vision

In modern reactive web frameworks (Vue 3, React), deep OOP class-inheritance chains (e.g., subclassing legacy controllers or rigid OWL component classes) are highly anti-pattern. Inheritance increases coupling, obscures reactive data flow, and forces components to carry unnecessary state baggages. 

To build a **Faster, Smaller, and Type-Safe** Odoo client, we strictly enforce the **Composition Pattern (组合模式)**:
*   **Decoupled State Hook**: Component logic and Odoo ORM states are entirely extracted into reusable Composable Hooks (`useOdooField`, `useOdooRelationField`).
*   **Zero-DOM UI Shells**: Vue Components serve strictly as light, modular "visual shells" that consume hooks and render standard Odoo styling.
*   **Third-Party Extensibility**: Standard components can be easily replaced by developers by injecting adapter components matching our standard props contract into the dynamic `componentRegistry`.

---

## 2. Base Field Composable Engine: `useOdooField`

Every Odoo input or display widget shares standard properties: value tracking, dynamic modifier evaluation (readonly, required, invisible), metadata introspection, and field-level validation errors. 

The `useOdooField` hook encapsulates these core logical pathways, keeping the view components completely headless.

### 2.1 API Definition (TypeScript)
```typescript
export interface OdooFieldProps {
    record: RecordProxy;              // Standard SDK Active Record Proxy
    name: string;                     // Physical field name (e.g. "partner_id")
    readonly?: boolean;               // View-level override to force readonly state
    options?: Record<string, any>;     // Custom view-arch widget options
}

export function useOdooField(props: OdooFieldProps) {
    // 1. Reactive value accessor (triggers SDK onchange and dirty trackers on write)
    const value = computed({
        get: () => props.record.get(props.name),
        set: (val) => props.record.set(props.name, val)
    });

    // 2. Modifier evaluation (synchronized with local activeContext and server-side rules)
    const isReadonly = computed(() => {
        if (props.readonly) return true;
        return props.record.isReadonly(props.name);
    });
    const isRequired = computed(() => props.record.isRequired(props.name));
    const isInvisible = computed(() => props.record.isInvisible(props.name));

    // 3. Metadata and naming resolution
    const fieldMeta = computed(() => props.record.model.fields[props.name] || {});
    const label = computed(() => fieldMeta.value.string || props.name);

    // 4. Client-side transactional error tracking
    const errors = computed(() => props.record.errors[props.name] || []);
    const isDirty = computed(() => props.record.isDirty(props.name));

    return {
        value,
        isReadonly,
        isRequired,
        isInvisible,
        fieldMeta,
        label,
        errors,
        isDirty
    };
}
```

---

## 3. Relational Field Composable Engine: `useOdooRelationField`

Relational fields (Many2one, One2many, Many2many) carry complex asynchronous data-fetching and navigation behaviors. The `useOdooRelationField` hook is a high-order Composable that composes `useOdooField` internally, extending it with search, relation creation, and modal-popup capabilities.

### 3.1 API Definition (TypeScript)
```typescript
export interface OdooRelationFieldProps extends OdooFieldProps {
    context?: Record<string, any>; // Cascading parent view context parameters
}

export function useOdooRelationField(props: OdooRelationFieldProps) {
    // Compose base field states
    const baseField = useOdooField(props);
    const { value, isReadonly } = baseField;

    const suggestions = ref<{ id: number; display_name: string }[]>([]);
    const isLoading = ref(false);
    const relationModel = computed(() => baseField.fieldMeta.value.relation);

    // Debounced name_search query execution
    let searchDebounceTimeout: any = null;
    const search = (query: string) => {
        if (isReadonly.value || !relationModel.value) return;
        isLoading.value = true;
        clearTimeout(searchDebounceTimeout);
        
        searchDebounceTimeout = setTimeout(async () => {
            try {
                const evalContext = props.record.evalContextWith(props.context);
                const evalDomain = props.record.evalDomainOf(props.name);

                const records = await props.record.model.sdk.rpc.call('name_search', {
                    model: relationModel.value,
                    name: query,
                    args: evalDomain,
                    context: evalContext,
                    limit: 8
                });
                suggestions.value = records.map(([id, name]: [number, string]) => ({ id, display_name: name }));
            } catch (err) {
                console.error(`Name search failed for ${props.name}:`, err);
                suggestions.value = [];
            } finally {
                isLoading.value = false;
            }
        }, 250);
    };

    const select = (id: number, displayName: string) => {
        value.value = [id, displayName]; // Standard Odoo [id, display_name] format
    };

    // Trigger actionManager routing to open the related form in a target new modal window
    const actionManager = inject('actionManager', null) as any;
    const openRelationForm = (id?: number) => {
        if (!actionManager || !relationModel.value) return;
        actionManager.doAction({
            type: 'ir.actions.act_window',
            res_model: relationModel.value,
            res_id: id,
            views: [[false, 'form']],
            target: 'new'
        });
    };

    return {
        ...baseField,
        suggestions,
        isLoading,
        relationModel,
        search,
        select,
        openRelationForm
    };
}
```

---

## 4. Advanced Core Widget Integration: QWeb WYSIWYG `FieldHtml`

For editing standard Odoo Email Templates (`mail.template`) or reports, administrators need a WYSIWYG editor that supports inserting smart placeholders (e.g. `${object.partner_id.name}`) and viewing real-time rendered previews without sending spam emails.

We compose `useOdooField` alongside a **headless, lightweight rich-text editor engine (Tiptap/ProseMirror)** and our native AOT **`QWebCompiler`** to deliver a dynamic, double-track editor component.

### 4.1 Component Composition Pattern
```typescript
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { QWebCompiler } from '@odoo/sdk';

export const FieldHtml = defineComponent({
    name: 'FieldHtml',
    props: odooFieldProps,
    setup(props) {
        const { value, isReadonly, isRequired } = useOdooField(props);

        // 1. Compose Headless Tiptap Rich-Text Engine
        const editor = useEditor({
            content: value.value || '',
            extensions: [StarterKit],
            editable: !isReadonly.value,
            onUpdate({ editor }) {
                value.value = editor.getHTML(); // Write visual updates atomically into RecordProxy transactional changes
            }
        });

        watch(() => value.value, (newVal) => {
            if (editor.value && newVal !== editor.value.getHTML()) {
                editor.value.commands.setContent(newVal || '');
            }
        });

        // 2. Smart Placeholders Injection
        const activeModelFields = computed(() => props.record.model.fields);
        const insertPlaceholder = (fieldName: string) => {
            if (!editor.value) return;
            editor.value.commands.insertContent(`\${object.${fieldName}}`); // Dynamic placeholder insertion
        };

        // 3. Double-Track Live Preview Compilation using QWebCompiler
        const activeTab = ref<'edit' | 'preview'>('edit');
        const livePreviewHTML = ref('');

        const updateLivePreview = () => {
            if (!value.value) {
                livePreviewHTML.value = '';
                return;
            }
            try {
                // Compile HTML QWeb template AOT
                const templateAST = QWebCompiler.compile(value.value);
                // Dynamically evaluate against current RecordProxy state inside client-side JS context sandbox
                livePreviewHTML.value = templateAST.evaluate({
                    object: props.record.toRawJSON()
                });
            } catch (err: any) {
                // Graceful exception sandboxing
                livePreviewHTML.value = `<div class="bg-red-50 text-red-600 p-3 rounded font-mono text-xs">
                    QWeb Compiler Error: ${err.message}
                </div>`;
            }
        };

        watch([activeTab, value], () => {
            if (activeTab.value === 'preview') {
                updateLivePreview();
            }
        });

        return () => {
            return h('div', { class: 'o_field_html border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm' }, [
                // Header Toolbox Bar
                h('div', { class: 'flex justify-between items-center bg-slate-50 px-4 py-2 border-b border-slate-200 text-sm' }, [
                    h('div', { class: 'flex space-x-2' }, [
                        h('button', {
                            class: ['px-3 py-1 rounded font-medium', activeTab.value === 'edit' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'],
                            onClick: () => { activeTab.value = 'edit'; }
                        }, 'Visual Edit'),
                        h('button', {
                            class: ['px-3 py-1 rounded font-medium', activeTab.value === 'preview' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'],
                            onClick: () => { activeTab.value = 'preview'; }
                        }, 'Live QWeb Preview')
                    ]),

                    // Smart Placeholders selector
                    activeTab.value === 'edit' && !isReadonly.value && h('div', { class: 'flex items-center space-x-2' }, [
                        h('span', { class: 'text-xs text-slate-500 font-semibold' }, 'Insert Placeholder:'),
                        h('select', {
                            class: 'border rounded px-2 py-0.5 text-xs text-slate-700 bg-white cursor-pointer focus:outline-none focus:border-purple-600',
                            onChange: (e: Event) => {
                                const target = e.target as HTMLSelectElement;
                                if (target.value) {
                                    insertPlaceholder(target.value);
                                    target.value = '';
                                }
                            }
                        }, [
                            h('option', { value: '' }, '-- Select Field --'),
                            Object.keys(activeModelFields.value).map(fName => h('option', { value: fName }, activeModelFields.value[fName].string || fName))
                        ])
                    ])
                ]),

                // Content Editor / Sandbox Preview Area
                h('div', { class: 'p-4 min-h-[300px]' }, [
                    activeTab.value === 'edit'
                        ? h(EditorContent, {
                            editor: editor.value,
                            class: 'prose prose-sm max-w-none focus:outline-none focus:border-transparent outline-none text-slate-800'
                          })
                        : h('div', {
                            class: 'prose prose-sm max-w-none text-slate-800 bg-slate-50/50 p-4 rounded border border-dashed border-slate-200',
                            innerHTML: livePreviewHTML.value
                          })
                ])
            ]);
        };
    }
});
```

---

## 5. Architectural Quality Gates & Testing Strategies

To verify behavioral correctness of our composition-based widgets, we run a Vitest suite mapping to two primary layers:

1.  **Composable Hook Isolation Tests (`*.test.ts`)**:
    *   Mock the `RecordProxy` object with reactive get/set overrides.
    *   Assert that reading `value` correctly binds to `RecordProxy.get(name)`.
    *   Assert that writing to `value` invokes `RecordProxy.set(name, value)`.
    *   Verify that reactive evaluations of `isReadonly`, `isRequired`, and `isInvisible` respond dynamically when record-level modifiers undergo mutation.
2.  **Relational Auto-Query Tests**:
    *   Mock RPC backend name-search routes returning standard dynamic datasets.
    *   Verify that trigger events (such as typing in the select input) execute debounced queries, accurately updating the reactive `suggestions` list.
3.  **QWeb WYSIWYG Sandbox Compilation Tests**:
    *   Mock a template text payload containing valid QWeb placeholding tags.
    *   Verify that toggle transitions to 'preview' execute local AST compilation, producing verified HTML outputs mapped to active test records.

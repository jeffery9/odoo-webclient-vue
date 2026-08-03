import { computed } from 'vue';

export interface OdooFieldProps {
    record: any;
    name: string;
    readonly?: boolean;
    options?: Record<string, any>;
}

export function useOdooField(props: OdooFieldProps) {
    const value = computed({
        get: () => props.record.get(props.name),
        set: (val) => props.record.set(props.name, val)
    });

    const isReadonly = computed(() => {
        if (props.readonly) return true;
        return props.record.isReadonly ? props.record.isReadonly(props.name) : false;
    });

    const isRequired = computed(() => {
        return props.record.isRequired ? props.record.isRequired(props.name) : false;
    });

    const isInvisible = computed(() => {
        return props.record.isInvisible ? props.record.isInvisible(props.name) : false;
    });

    const fieldMeta = computed(() => {
        return (props.record.model?.fields && props.record.model.fields[props.name]) || {};
    });

    const label = computed(() => fieldMeta.value.string || props.name);
    const errors = computed(() => (props.record.errors && props.record.errors[props.name]) || []);
    const isDirty = computed(() => (props.record.isDirty && props.record.isDirty(props.name)) || false);

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

import { ref, computed, inject } from 'vue';
import { useOdooField, OdooFieldProps } from './useOdooField.js';

export interface OdooRelationFieldProps extends OdooFieldProps {
    context?: Record<string, any>;
}

export function useOdooRelationField(props: OdooRelationFieldProps) {
    const baseField = useOdooField(props);
    const { value, isReadonly } = baseField;

    const suggestions = ref<{ id: number; display_name: string }[]>([]);
    const isLoading = ref(false);
    const relationModel = computed(() => baseField.fieldMeta.value.relation);

    let searchDebounceTimeout: any = null;
    const search = (query: string) => {
        if (isReadonly.value || !relationModel.value) return;
        isLoading.value = true;
        clearTimeout(searchDebounceTimeout);

        searchDebounceTimeout = setTimeout(async () => {
            try {
                const evalContext = props.record.evalContextWith ? props.record.evalContextWith(props.context) : {};
                const evalDomain = props.record.evalDomainOf ? props.record.evalDomainOf(props.name) : [];

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
        value.value = [id, displayName];
    };

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

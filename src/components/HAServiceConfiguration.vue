<template>
    <div v-if="props?.fields">
        <ul class="field-list" :class="{ 'empty': !modelValue.length }">
            <li v-for="(fieldValue, index) in modelValue">
                <div class="field-input-section">
                    <label :for="`field-${fieldValue.fieldId}`">{{ props?.fields[fieldValue.fieldId].name }}</label>
                    <SDInput v-if="Object.keys(props?.fields[fieldValue.fieldId].selector)[0] === 'number'" :id="`field-${fieldValue.fieldId}`" v-model="fieldValue.value" type="number"
                        :min="props?.fields[fieldValue.fieldId].selector.number.min"
                        :max="props?.fields[fieldValue.fieldId].selector.number.max"
                        :step="props?.fields[fieldValue.fieldId].selector.number.step"
                        :placeholder="props?.fields[fieldValue.fieldId].example"></SDInput>
                    <div v-else-if="['rgb_color', 'rgbw_color', 'rgbww_color'].includes(fieldValue.fieldId)" class="field-group" :set="fieldValue.value ||= [0,0,0]">
                        <SDInput :id="`field-${fieldValue.fieldId}`" v-model="colorFieldsValues[fieldValue.fieldId]" type="color"></SDInput>
                        <SDInput v-if="['rgbw_color', 'rgbww_color'].includes(fieldValue.fieldId)" v-model="fieldValue.value[3]" type="number" placeholder="White"></SDInput>
                        <SDInput v-if="['rgbww_color'].includes(fieldValue.fieldId)" v-model="fieldValue.value[4]" type="number" placeholder="Warm White"></SDInput>
                    </div>
                    <SDSelect v-else-if="Object.keys(props?.fields[fieldValue.fieldId].selector)[0] === 'select'" :id="`field-${fieldValue.fieldId}`" v-model="fieldValue.value" :class="{ 'disabled': fieldValue.value === null }">
                        <option disabled :value="null">Select...</option>
                        <option v-for="opt in props?.fields[fieldValue.fieldId].selector.select.options" :key="opt" :value="opt">
                            {{ opt }}
                        </option>
                    </SDSelect>
                    <SDInput v-else :id="`field-${fieldValue.fieldId}`" v-model="fieldValue.value" :placeholder="props?.fields[fieldValue.fieldId].example"></SDInput>
                </div>
                <SDButton label="-" small @click="onFieldRemove(index)"></SDButton>
            </li>
            <div v-if="!modelValue.length" class="empty-list-label">No config selected</div>
        </ul>

        <SDItem class="field-select">
            <SDButton label="+" small @click="onFieldAdd"></SDButton>
            <SDSelect v-model="selectedField" :disabled="!Object.keys(availableFields).length">
                <option v-if="!Object.keys(availableFields).length" :value="null" disabled>No field available</option>
                <option v-else :value="null" disabled>Select a field...</option>
                <option v-for="[fieldId, field] in Object.entries(availableFields)" :key="fieldId" :value="fieldId">
                    {{ field.name || fieldId }}
                </option>
            </SDSelect>
        </SDItem>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
interface Field {
    fieldId: string;
    value: any;
}

const props = defineProps<{
    modelValue: Array<Field>,
    fields: Record<string, any> | null;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: typeof props.modelValue): void
}>();

const selectedField = ref<string | null>(null);

const modelValue = computed({
    get() {
        return props.modelValue;
    },
    set(value: typeof props.modelValue) {
        emit('update:modelValue', value);
    }
});

watch(() => props.fields, () => selectedField.value = null);

const availableFields: Record<string, any> = computed(() => {
    const usedFields = modelValue.value.map(fieldValue => fieldValue.fieldId);
    if (props?.fields) {
       return Object.fromEntries(Object.entries(props?.fields).filter(([fieldId]) => !usedFields.includes(fieldId)));
    }
    return [];
});

const onFieldAdd = () => {
    if (selectedField.value) {
        modelValue.value.push({ fieldId: selectedField.value, value: null });
        selectedField.value = null;
    }
};

const onFieldRemove = (index: number) => {
    modelValue.value.splice(index, 1);
};

const asHEX = (rgbValue: number[]) => {
    return rgbValue?.length ? '#' + rgbValue[0].toString(16).padStart(2, '0') + rgbValue[1].toString(16).padStart(2, '0') + rgbValue[2].toString(16).padStart(2, '0') : null;
}

const asRGB = (hexValue: string) => {
    return hexValue ? [
        parseInt(hexValue.substring(1, 3), 16),
        parseInt(hexValue.substring(3, 5), 16),
        parseInt(hexValue.substring(5), 16),
    ] : [];
}

const colorFieldsValues = new Proxy<Record<string, Field>>({}, {
    get(_target, prop: string) {
        const field = props.modelValue.find(field => field.fieldId === prop);
        return field?.value ? asHEX(field.value) as string : '';
    },
    set(_target, prop: string, value: string) {
        const field = props.modelValue.find(field => field.fieldId === prop);
        if (field && typeof value === 'string') {
            field.value = [...asRGB(value), ...field.value.slice(3)];
        }
        return true;
    }
});
</script>

<style scoped>
.field-list {
    min-height: 80px;
    max-height: max(50vh, 160px);
    background: rgba(0, 0, 0, .12);
    margin: 8px 14px 8px 6px;
    list-style: none;
    padding-left: 0;
}
.field-list.empty {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: auto;
}

.field-list li {
    display: flex;
    align-items: center;
    padding: 2px 0 4px 8px;
}

.field-list .field-input-section {
    display: flex;
    flex-direction: column;
    width: 66%;
}

.field-list label {
    font-weight: bold;
}

.field-list input,
.field-list select {
    min-width: unset;
    margin: 2px 0;
}

.field-list input:not([type="color"]),
.field-list select {
    padding: 4px;
}

.field-list .field-group {
    display: flex;
    align-items: center;
}

.field-list .field-group input:not(:first-child) {
    margin-left: 6px;
}

.field-list .field-group input {
    min-width: 0;
}

.field-list button {
    flex: unset;
    margin-left: auto;
}

.field-list .empty-list-label {
    font-size: 1.15rem;
    opacity: .5;
}

.field-select {
    display: flex;
}

.field-select select {
    flex: 1;
    padding: 2px;
}

.disabled {
    color: var(--sdpi-buttonbordercolor);
}
</style>

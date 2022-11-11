<template>
    <select v-model="modelValue" class="sdpi-item-value select">
        <slot></slot>
    </select>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>();

const modelValue = computed({
    get() {
        return props.modelValue;
    },
    set(value: string) {
        emit('update:modelValue', value);
    }
});
</script>

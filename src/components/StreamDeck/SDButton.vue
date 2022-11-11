<template>
    <button :class="`sdpi-item-value ${props.small ? 'max20' : ''}`">{{ props.label }}</button>
</template>

<script lang="ts" setup>
const props = defineProps<{
    label: string;
    small?: boolean;
}>();
</script>

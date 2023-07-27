<template>
    <button :class="`${props.small ? '' : 'sdpi-item-value'} ${active ? 'active' : ''}`">{{ props.label }}</button>
</template>

<script lang="ts" setup>
const props = defineProps<{
    label: string;
    small?: boolean;
    active?: boolean;
}>();
</script>

<style scoped>
button.active {
    border-color: var(--sdpi-secondary-color);
    background-color: var(--sdpi-secondary-bordercolor);
}
button.active:active {
    background-color: var(--sdpi-secondary-color);
}
</style>

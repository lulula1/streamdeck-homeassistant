<template>
    <button :class="`sdpi-item-value ${props.small ? 'small' : ''} ${active ? 'active' : ''}`">{{ props.label }}</button>
</template>

<script lang="ts" setup>
const props = defineProps<{
    label: string;
    small?: boolean;
    active?: boolean;
}>();
</script>

<style scoped>
button.small {
    flex: unset;
    width: 23px;
}
button.active {
    border-color: var(--sdpi-secondary-color);
    background-color: var(--sdpi-secondary-bordercolor);
}
button.active:active {
    background-color: var(--sdpi-secondary-color);
}
</style>

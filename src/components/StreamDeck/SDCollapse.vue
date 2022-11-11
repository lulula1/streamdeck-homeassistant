<template>
    <details :open="props.open || undefined">
        <summary>{{ props.label }}</summary>
        <slot></slot>
    </details>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
    label: string;
    open?: boolean;
}>(), {
    open: false
});
</script>

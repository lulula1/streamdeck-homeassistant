<template>
    <div class="sdpi-item" :type="props.type">
        <div v-if="props.label" class="sdpi-item-label">{{ props.label }}</div>
        <slot></slot>
    </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
    label?: string;
    type?: string;
}>();
</script>

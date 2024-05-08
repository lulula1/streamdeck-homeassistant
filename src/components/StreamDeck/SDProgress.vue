<template>
    <SDItem type="progress" :label="props.label">
        <progress :class="`sdpi-item-value ${props.additionalClasses || ''}`" :value="props.value"
            :max="props.max"></progress>
    </SDItem>
</template>

<script lang="ts" setup>
import SDItem from './SDItem.vue';

const props = withDefaults(defineProps<{
    label?: string;
    value: number;
    max?: number;
    additionalClasses?: string;
}>(), {
    max: 1,
});
</script>

<style scoped>
progress[value]::-webkit-progress-value {
    transition: width 0.5s;
}

progress.fail::-webkit-progress-value {
    background-color: red;
}
</style>

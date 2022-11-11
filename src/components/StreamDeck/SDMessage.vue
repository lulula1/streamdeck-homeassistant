<template>
    <details :class="`message ${ props.iconType || '' }`">
        <summary>
            <slot></slot>
        </summary>
    </details>
</template>

<script lang="ts" setup>
type IconType = 'info' | 'caution' | 'question';
const props = defineProps<{
    iconType?: IconType;
}>();
</script>

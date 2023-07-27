<template>
    <SDItem type="carousel">
        <div type="carousel" class="card-carousel-wrapper" :style="{ '--visible-cards': props.countPerPage }">
            <div class="card-carousel--nav" @click="navigateLeft()" :disabled="isAtStart() || undefined">
                <div class="card-carousel--nav__left"></div>
            </div>
            <div class="card-carousel">
                <div class="card-carousel-cards" :style="{ transform: `translateX(${offset}px)` }">
                    <div v-for="(card, index) in props.values" :key="index" class="card-carousel--card"
                        :class="{ 'card-carousel--card--selected': selectedValues.includes(card) }" @click="cardClick($event, card, index)">
                        <img :src="card.src">
                        <div class="card-carousel--card--footer" :title="card.label">{{ card.label }}</div>
                    </div>
                </div>
            </div>
            <div class="card-carousel--nav" @click="navigateRight()" :disabled="isAtEnd() || undefined">
                <div class="card-carousel--nav__right"></div>
            </div>
        </div>
    </SDItem>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from "vue";
import SDItem from "./SDItem.vue";

export interface CarouselValue {
    label: string;
    src: string;
    value?: string;
}

const props = withDefaults(defineProps<{
    values: CarouselValue[];
    selectedValues?: CarouselValue[];
    countPerPage?: number;
}>(), {
    selectedValues: () => [],
    countPerPage: 4,
});

const emit = defineEmits<{
    (e: 'cardClick', event: MouseEvent, value: CarouselValue, index: number): void
}>();

const offset = ref(0);
const cardWidth = computed(() => 296 / props.countPerPage);
let maxOffset = 0;

const move = (moveOffset: number) => {
    offset.value -= moveOffset;
    offset.value = Math.max(maxOffset, Math.min(offset.value, -0));
};

const navigateLeft = () => move(-cardWidth.value);
const navigateRight = () => move(cardWidth.value);

// Not using computed for the two next functions
// because we need reevaluation on every render
const isAtStart = () => offset.value >= 0;
const isAtEnd = () => offset.value <= maxOffset;

const cardClick = (event: MouseEvent, value: CarouselValue, index: number) => {
    emit('cardClick', event, value, index);
};

watchEffect(() => {
    maxOffset = -cardWidth.value * Math.max(0, props.values.length - props.countPerPage);
    move(0);    // Recompute offset
});

defineExpose({
    navigateLeft,
    navigateRight,
    isAtStart,
    isAtEnd,
});
</script>

<style scoped>
.sdpi-item.card-carousel-wrapper,
.sdpi-item>.card-carousel-wrapper {
    padding: 0;
}

.card-carousel-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 12px auto;
    color: #666a73;
}

.card-carousel {
    display: flex;
    width: 296px;
    margin: 0 4px;
    overflow: hidden;
}

.card-carousel--nav {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60px;
    border-radius: 4px;
    transition: transform 100ms ease-out;
}

.card-carousel--nav:not([disabled]):hover {
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
}

.card-carousel--nav__left,
.card-carousel--nav__right {
    /* display: inline-block; */
    width: 12px;
    height: 12px;
    border-top: 2px solid var(--sdpi-secondary-color);
    border-right: 2px solid var(--sdpi-secondary-color);
    margin: 0 4px;
}

.card-carousel--nav[disabled]>div {
    opacity: 0.2;
    border-color: black;
}

.card-carousel--nav:active {
    transform: scale(0.88);
}

.card-carousel--nav__left {
    transform: translate(4px) rotate(-135deg);
}

.card-carousel--nav__right {
    transform: translate(-4px) rotate(45deg);
}

.card-carousel-cards {
    display: flex;
    transition: transform 150ms ease-out;
}

.card-carousel-cards .card-carousel--card {
    display: flex;
    flex-direction: column;
    margin: 0 5px;
    cursor: pointer;
    /* box-shadow: 0 4px 15px 0 rgba(40, 44, 53, 0.06), 0 2px 2px 0 rgba(40, 44, 53, 0.08); */
    background-clip: padding-box;
    width: calc(296px / var(--visible-cards) - 14px);
    border-radius: 6px;
    border: 2px solid hsl(0, 0%, 30%);
    z-index: 3;
}

.xxcard-carousel-cards .card-carousel--card:first-child {
    margin-left: 0;
}

.xxcard-carousel-cards .card-carousel--card:last-child {
    margin-right: 0;
}

.card-carousel-cards .card-carousel--card--selected {
    border-color: var(--sdpi-secondary-color);
}

.card-carousel-cards .card-carousel--card img {
    vertical-align: bottom;
    border-radius: 4px 4px 0 0;
    transition: opacity 150ms linear;
    width: calc(296px / var(--visible-cards) - 14px);
}

/* .card-carousel-cards .card-carousel--card img:hover {
    opacity: 0.5;
} */

.card-carousel-cards .card-carousel--card--footer {
    flex: 1;
    text-align: center;
    padding: 2px 4px;
    color: #fff;
    background-color: #292929;
    border-radius: 0 0 4px 4px;
    overflow: hidden;
}

.card-carousel-cards .card-carousel--card--footer p {
    padding: 3px 0;
    margin: 0;
    margin-bottom: 2px;
    font-size: 15px;
    font-weight: 500;
    color: #2c3e50;
}

.card-carousel-cards .card-carousel--card--footer p:nth-of-type(2) {
    font-size: 12px;
    font-weight: 300;
    padding: 6px;
    color: #666a73;
}
</style>

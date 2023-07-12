<template>
    <SDHeading>DOMAIN</SDHeading>
    <SDCarousel :key="carouselRefreshKey" :values="domainValues" :selectedValues="selectedDomainValues"
        @cardClick="onCardClick"></SDCarousel>
    <SDHeading>ENTITY</SDHeading>
    <SDItem label="Entity">
        <SDSelect v-model="settings.state">
            <option v-for="stateValue in states" :key="stateValue.entity_id" :value="stateValue.entity_id">
                {{ stateValue.attributes.friendly_name || stateValue.entity_id }}
            </option>
        </SDSelect>
    </SDItem>
    <SDHeading>PRESS CONFIGURATION</SDHeading>
    <SDItem label="Service">
        <SDSelect v-model="settings.service">
            <option v-for="serviceValue in services" :key="serviceValue.id" :value="serviceValue.id">
                {{ serviceValue.name || serviceValue.id }}
            </option>
        </SDSelect>
    </SDItem>
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeMount, reactive, Ref, ref, watch } from 'vue';
import type { StreamDeckPI } from '../lib/StreamDeck';
import type { HomeAssistant, State, Service } from '../lib/HomeAssistant';
import { waitForRef, waitForConnectable } from '../lib/Utils';
import type { CarouselValue } from './StreamDeck/SDCarousel.vue';
import IconBuilder from '../lib/IconBuilder';
import { IconFactory } from '../lib/IconFactory';

let SD: StreamDeckPI;
let HA: HomeAssistant;

const states = ref<State[]>([]);
const services = ref<Service[]>([]);
const settings = reactive({
    domain: 'light',
    state: null as string | null,
    service: null as string | null,
    iconVariant: 0 as any,
});

const placeholderIcon = new IconBuilder(128, 128).fillColor('#0a1423').build();

const domainValues: CarouselValue[] = [
    { label: 'Light', src: placeholderIcon, value: 'light' },
    { label: 'Switch', src: placeholderIcon, value: 'switch' },
    { label: 'Automation', src: placeholderIcon, value: 'automation' },
    { label: 'Scene', src: placeholderIcon, value: 'scene' },
    { label: 'Script', src: placeholderIcon, value: 'script' },
];

const domains = domainValues.map(domainValue => domainValue.value);

let carouselRefreshKey = ref(0);

const refreshCarousel = () => carouselRefreshKey.value++;

const iconFactory = new IconFactory(128, 128, '#0a1423');

const loadCarouselIcons = () => {
    Promise.all(
        domains.map(async domain => {
            const domainValue = domainValues.find(({ value }) => value === domain);
            const iconVariant = settings.domain === domain ? settings.iconVariant : 0;
            const icon: Promise<string> | null = iconFactory.getIconVariantBuilder(domain as any, iconVariant)?.();
            domainValue && icon && (domainValue.src = await icon);
        })
    ).then(refreshCarousel);
};

const selectedDomainValues = computed(() => [domainValues.find(domainValue => domainValue.value === settings.domain)]);

const getServices = (domain: string): Promise<Service[]> => {
    return HA.getServicesByDomain(domain);
}

const getStates = (domain: string): Promise<State[]> => {
    return HA.getStatesByDomain(domain);
}

const onCardClick = (ev: MouseEvent, cardValue: CarouselValue, index: number) => {
    if (!cardValue.value) return;
    if (cardValue.value != settings.domain) {
        settings.domain = cardValue.value;
        settings.iconVariant = 0;
        getStates(settings.domain)
            .then(res => states.value = res)
            .then(res => settings.state = (res || [])[0]?.entity_id || null);
        getServices(settings.domain)
            .then(res => services.value = res)
            .then(res => settings.service = (res || [])[0]?.id || null);
    } else {
        settings.iconVariant = (settings.iconVariant + 1) % iconFactory.getIconVariantLength(cardValue.value as any);
    }
    loadCarouselIcons();
}

onBeforeMount(async () => {
    const sdRef = inject('SD') as Ref<StreamDeckPI>;
    const haRef = inject('HA') as Ref<HomeAssistant>;
    SD = await waitForRef(sdRef);
    HA = await waitForRef(haRef);

    await waitForConnectable(SD);

    SD.getSettings()
        .then(savedSettings => {
            SD.log('restore settings', savedSettings);
            (Object.keys(settings) as Array<keyof typeof settings>)
                .forEach(settingKey => savedSettings[settingKey] && (settings[settingKey] = savedSettings[settingKey]));
        })
        .then(loadCarouselIcons);

    // Save settings upon change
    watch(settings, () => SD.addSettings({ ...settings }));

    HA.on('connected', async () => {
        if (settings.domain) {
            getStates(settings.domain).then(res => states.value = res).then(res => settings.state = settings.state || (res || [])[0]?.entity_id);
            getServices(settings.domain).then(res => services.value = res).then(res => settings.service = settings.service || (res || [])[0]?.id);
        }
    });
});
</script>

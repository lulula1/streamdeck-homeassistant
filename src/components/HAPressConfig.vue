<template>
    <SDHeading>DOMAIN</SDHeading>
    <SDCarousel :key="carouselRefreshKey" :values="domainValues" :selectedValues="selectedDomainValues"
        @cardClick="onCardClick"></SDCarousel>
    <SDMessage iconType="info">
        Press again to change icon
    </SDMessage>
    <SDHeading>ENTITY</SDHeading>
    <SDItem label="Entity">
        <SDSelect v-model="settings.state.value" :disabled="settings.state.isVariable">
            <option v-for="stateValue in states" :key="stateValue.entity_id" :value="stateValue.entity_id">
                {{ settings.state.isVariable ? '...' : stateValue.attributes.friendly_name || stateValue.entity_id }}
            </option>
        </SDSelect>
        <SDButton label="≈" small :active="settings.state.isVariable" title="Toggle variable mode"
            @click="settings.state.isVariable = !settings.state.isVariable"></SDButton>
    </SDItem>
    <SDHeading>PRESS CONFIGURATION</SDHeading>
    <SDItem label="Service">
        <SDSelect v-model="settings.service.value" :disabled="settings.service.isVariable" @change="resetServiceConfig">
            <option v-for="serviceValue in services" :key="serviceValue.id" :value="serviceValue.id">
                {{ settings.service.isVariable ? '...' : serviceValue.name || serviceValue.id }}
            </option>
        </SDSelect>
        <SDButton label="≈" small :active="settings.service.isVariable" title="Toggle variable mode"
            @click="settings.service.isVariable = !settings.service.isVariable"></SDButton>
    </SDItem>
    <HAServiceConfiguration v-if="!settings.service.isVariable" v-model="settings.serviceConfig" :fields="services.find(s => s.id === settings.service.value)?.fields || null" />
</template>

<script lang="ts" setup>
import { computed, inject, onBeforeMount, reactive, Ref, ref, watch } from 'vue';
import type { StreamDeckPI } from '../lib/StreamDeck';
import type { HomeAssistant, State, Service } from '../lib/HomeAssistant';
import { waitForRef, waitForConnectable } from '../lib/Utils';
import type { CarouselValue } from './StreamDeck/SDCarousel.vue';
import IconBuilder from '../lib/IconBuilder';
import { IconFactory } from '../lib/IconFactory';
import type { HAActionSettings } from '../lib/HASettings';
import HAServiceConfiguration from './HAServiceConfiguration.vue';

let SD: StreamDeckPI;
let HA: HomeAssistant;

const states = ref<State[]>([]);
const services = ref<Service[]>([]);
const settings = reactive({
    domain: { value: 'light' },
    state: { value: '' },
    service: { value: '' },
    serviceConfig: [],
    iconVariant: 0,
}) as HAActionSettings;

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
            const iconVariant = settings.domain.value === domain ? settings.iconVariant : 0;
            const icon: Promise<string> | null = iconFactory.getIconVariantBuilder(domain as any, iconVariant)?.();
            domainValue && icon && (domainValue.src = await icon);
        })
    ).then(refreshCarousel);
};

const selectedDomainValues = computed(() => [domainValues.find(domainValue => domainValue.value === settings.domain.value)]);

const getServices = (domain: string): Promise<Service[]> => {
    return HA.getServicesByDomain(domain);
}

const getStates = (domain: string): Promise<State[]> => {
    return HA.getStatesByDomain(domain);
}

const onCardClick = (_ev: MouseEvent, cardValue: CarouselValue) => {
    if (!cardValue.value) return;
    if (cardValue.value != settings.domain.value) {
        settings.domain.value = cardValue.value;
        settings.iconVariant = 0;
        getStates(settings.domain.value)
            .then(res => states.value = res)
            .then(res => settings.state.value = res?.[0]?.entity_id || '')
        getServices(settings.domain.value)
            .then(res => services.value = res)
            .then(res => settings.service.value = res?.[0]?.id || '');
    } else {
        settings.iconVariant = (settings.iconVariant + 1) % iconFactory.getIconVariantLength(cardValue.value as any);
    }
    loadCarouselIcons();
    resetServiceConfig();
}

const resetServiceConfig = () => {
    settings.serviceConfig = [];
};

onBeforeMount(async () => {
    const sdRef = inject('SD') as Ref<StreamDeckPI>;
    const haRef = inject('HA') as Ref<HomeAssistant>;
    SD = await waitForRef(sdRef);
    HA = await waitForRef(haRef);

    await waitForConnectable(SD);

    SD.getSettings()
        .then((savedSettings: HAActionSettings) => {
            SD.log('restore settings', savedSettings);
            (Object.keys(settings) as Array<keyof HAActionSettings>)
                // @ts-ignore
                .forEach(settingKey => savedSettings[settingKey] && (settings[settingKey] = savedSettings[settingKey]));
        })
        .then(loadCarouselIcons);

    // Save settings upon change
    watch(settings, () => SD.addSettings({ ...settings }));

    HA.on('connected', async () => {
        if (settings.domain) {
            getStates(settings.domain.value).then(res => states.value = res).then(res => settings.state.value = settings.state.value || res?.[0]?.entity_id);
            getServices(settings.domain.value).then(res => services.value = res).then(res => settings.service.value = settings.service.value || res?.[0]?.id);
        }
    });
});
</script>

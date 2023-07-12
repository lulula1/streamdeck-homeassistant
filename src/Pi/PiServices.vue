<template>
    <SDWrapper>
        <HAServerConfig></HAServerConfig>
        <HAPressConfig></HAPressConfig>
        <HALongPressConfig></HALongPressConfig>
    </SDWrapper>
</template>

<script lang="ts" setup>
import { provide, ref } from 'vue';
import { StreamDeckPI } from '../lib/StreamDeck';
import { HomeAssistant } from '../lib/HomeAssistant';
import { waitForConnectable, waitForRef } from '../lib/Utils';
import HAServerConfig from '../components/HAServerConfig.vue';
import HAPressConfig from '../components/HAPressConfig.vue';
import HALongPressConfig from '../components/HALongPressConfig.vue';

const SDRef = ref<StreamDeckPI>();
const HARef = ref<HomeAssistant>();

provide('SD', SDRef);
provide('HA', HARef);

(window as any).connectElgatoStreamDeckSocket = async (inPort: string, inUUID: string, inRegisterEvent: string, inInfo: string, inActionInfo: string) => {
    SDRef.value = new StreamDeckPI(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo || "{}");
    const SD = await waitForRef(SDRef);

    await waitForConnectable(SD);

    const settings = await SD.getGlobalSettings();
    HARef.value = new HomeAssistant(settings.haUrl, settings.haToken);
};
</script>

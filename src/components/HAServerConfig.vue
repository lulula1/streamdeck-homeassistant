<template>
    <SDHeading>SERVER CONFIGURATION</SDHeading>
    <SDItem label="Server URL">
        <SDInput type="url" v-model="settings.haUrl" placeholder="Enter web socket URL"
            pattern="wss?://.*/api/websocket" @change="saveGlobalSettings">
        </SDInput>
    </SDItem>
    <SDItem label="Access Token">
        <SDInput type="password" v-model="settings.haToken" placeholder="Enter your long-lived access token"
            @change="saveGlobalSettings"></SDInput>
    </SDItem>
    <SDItem>
        <SDMessage iconType="info">
            For example: ws://localhost:8123/api/websocket
        </SDMessage>
    </SDItem>
    <SDItem>
        <SDButton label="Connect" @click="doConnect"></SDButton>
    </SDItem>
    <SDProgress :value="connect.state" :additionalClasses="connect.failed ? 'fail' : undefined"></SDProgress>
</template>

<script lang="ts" setup>
import { inject, ref, onBeforeMount, Ref, reactive } from 'vue';
import type { StreamDeckPI } from '../lib/StreamDeck';
import { HomeAssistant } from '../lib/HomeAssistant';
import { waitForRef, waitForConnectable } from '../lib/Utils';

const HARef: Ref<HomeAssistant> = inject('HA')!;

let SD: StreamDeckPI;
let HA: HomeAssistant;

const connect = ref({
    failed: false,
    state: 0.33,
});

const settings = reactive({
    haUrl: '',
    haToken: '',
});

const isConnectSuccess = () => !connect.value.failed;
const connectPending = () => connect.value = { failed: false, state: 0.33 };
const connectSuccess = () => connect.value = { failed: false, state: 1 };
const connectFail = () => connect.value = { failed: true, state: 1 };

onBeforeMount(async () => {
    SD = await waitForRef(inject('SD')!);

    await waitForConnectable(SD);

    const { haUrl, haToken } = await SD.getGlobalSettings();

    settings.haUrl = haUrl;
    settings.haToken = haToken;
    if (settings.haUrl && settings.haToken) {
        doConnect();
    }
})

const doConnect = () => {
    connectPending();
    if (!settings.haUrl && !settings.haToken) {
        connectFail();
        return;
    }
    if (HA) HA.close();
    try {
        SD.log(`connecting to ${settings.haUrl}`);
        HA = HARef.value = new HomeAssistant(settings.haUrl, settings.haToken);
        HA.on('connected', connectSuccess);
        HA.on('error', connectFail);
    } catch {
        connectFail();
    }
};

const saveGlobalSettings = async () => {
    SD.log("saving global home assistant settings");
    SD.addGlobalSettings({ ...settings });
}
</script>

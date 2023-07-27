<template>
    <SDHeading>LONG PRESS CONFIGURATION</SDHeading>
    <SDItem label="Profile">
        <SDSelect v-model="profile" @change="saveProfile">
            <option :value="null">--</option>
            <option v-for="profile in profiles" :key="profile.Name" :value="profile.Name">
                {{ getFileName(profile.Name) }}
            </option>
        </SDSelect>
    </SDItem>
</template>

<script lang="ts" setup>
import { inject, onBeforeMount, ref } from 'vue';
import manifest from '@public/manifest.json';
import type { StreamDeckPI } from '../lib/StreamDeck';
import { waitForConnectable, waitForRef } from '../lib/Utils';

let SD: StreamDeckPI;

let profiles: any[] = manifest.Profiles;
let profile = ref<string>();

// Keep filename and exclude trailing extensions
const getFileName = (name: string) => /[\\\/]([^\.]*)\..*?$/.exec(name)?.[1].replaceAll('_', ' ').replaceAll('!', '|');

const saveProfile = () => {
    SD.addSettings({
        profile: profile.value
    });
};


onBeforeMount(async () => {
    SD = await waitForRef(inject('SD')!);

    await waitForConnectable(SD);

    SD.getSettings()
        .then(settings => {
            profile.value = settings.profile;
        })

    profiles = manifest.Profiles
        .filter((profile: any) => profile.DeviceType === SD.getDevice().type);
})
</script>

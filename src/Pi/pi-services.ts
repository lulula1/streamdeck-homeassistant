import { createApp } from 'vue';
import PiServices from './PiServices.vue';

import '../assets/sdpi.css';
import VueStreamDeck from '../components/StreamDeck';


createApp(PiServices)
    .use(VueStreamDeck)
    .mount('#app');

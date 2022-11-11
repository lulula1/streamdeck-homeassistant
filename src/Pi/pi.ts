import { createApp } from 'vue';
import Pi from './Pi.vue';

import '../assets/sdpi.css';
import VueStreamDeck from '../components/StreamDeck';


createApp(Pi)
    .use(VueStreamDeck)
    .mount('#app');

import type { App } from 'vue';
import * as components from './components';

export default {
    install(app: App) {
        Object.entries(components)
            .forEach(([name, component]) => app.component(name, component));
    }
}

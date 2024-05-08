import { waitForConnectable } from '../lib/Utils';
import { Entity, HomeAssistant, State } from '../lib/HomeAssistant';
import { IconFactory } from '../lib/IconFactory';
import { StreamDeckPlugin } from '../lib/StreamDeck';
import type { ActionEventHA, HAActionSettings, SettingVariable } from '../lib/HASettings';

const COLOR_TEMP_GRADIENT = ['#ffa200', '#ffa404', '#fea509', '#fea70d', '#fea811', '#fdaa16', '#fdab1a', '#fdad1e', '#fcae23', '#fcb027', '#fcb12b', '#fbb330', '#fbb434', '#fbb638', '#fab73d', '#fab941', '#faba45', '#f9bc49', '#f9bd4e', '#f9bf52', '#f8c156', '#f8c25b', '#f8c45f', '#f7c563', '#f7c768', '#f7c86c', '#f6ca70', '#f6cb75', '#f6cd79', '#f5ce7d', '#f5d082', '#f4d186', '#f4d38a', '#f4d48f', '#f3d693', '#f3d797', '#f3d99c', '#f2daa0', '#f2dca4', '#f2dda9', '#f1dfad', '#f1e1b1', '#f1e2b6', '#f0e4ba', '#f0e5be', '#f0e7c2', '#efe8c7', '#efeacb', '#efebcf', '#eeedd4'];

(window as any).connectElgatoStreamDeckSocket = async (inPort: string, inUUID: string, inRegisterEvent: string, inInfo: string, inActionInfo: string) => {
    const SD = new StreamDeckPlugin(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo || '{}');
    const actionSettings: Record<string, HAActionSettings> = {};

    await waitForConnectable(SD);

    SD.log(`I'm connected! Hahaha!`);

    const { haUrl, haToken } = await SD.getGlobalSettings();
    const HA = new HomeAssistant(haUrl, haToken);

    HA.on('connected', () => {
        SD.log(`HomeAssistant connected on ${HA.url}`);
        HA.subscribeEvents(async (event: any) => {
            SD.log('SubscribeEvents', event);
            const { variableSettings } = await SD.getGlobalSettings()
            Object.keys(actionSettings)
                .filter((context) => getSettingValue(actionSettings[context].state, variableSettings?.state) === event.data.entity_id)
                .map((context) => updateActionIcon(context, actionSettings[context], event.data.new_state));
        });
    });

    // Update button icon when it appears to the user
    // and save its data for further use
    SD.on('willAppear', async (message: ActionEventHA) => {
        SD.log('willAppear', message);
        const context = message.context;
        const settings = message.payload.settings;
        actionSettings[context] = settings;
        const { variableSettings } = await SD.getGlobalSettings()
        const entityId = getSettingValue(settings.state, variableSettings?.state);
        if (entityId)
            HA.getState(entityId)
                .then(updateActionIcon.bind(null, context, settings));
    });

    // Get rid of button data as it's not shown anymore
    SD.on('willDisappear', (message: ActionEventHA) => {
        SD.log('willDisappear', message);
        const context = message.context;
        delete actionSettings[context];
    });

    SD.on("didReceiveSettings", async (message: ActionEventHA) => {
        SD.log('didReceiveSettings', message);
        const context = message.context;
        const settings = message.payload.settings;
        actionSettings[context] = settings;
        const { variableSettings } = await SD.getGlobalSettings()
        const entityId = getSettingValue(settings.state, variableSettings?.state);
        if (entityId)
            HA.getState(entityId)
                .then(updateActionIcon.bind(null, context, settings));
    });

    const iconFactory: IconFactory = new IconFactory(128, 128, '#0a1423b3');

    const updateActionIcon = async (context: string, settings: any, state: State) => {
        const entity = new Entity(state.entity_id);
        const isOn = state.state === 'on';

        const icon = await getStateIcon(entity, settings, state);
        icon && SD.setImage(context, icon);
        SD.setState(context, +isOn);
    }

    const getStateIcon = (entity: Entity, settings: any, state: State): Promise<string> | undefined => {
        const isOn = state.state === 'on';
        if (entity.domain === "light") {
            const colored = state.attributes.color_mode === 'hs';
            const colorTempValue = 1 - (state.attributes.color_temp - state.attributes.min_mireds) / (state.attributes.max_mireds - state.attributes.min_mireds);
            const colorTempColor = COLOR_TEMP_GRADIENT[Math.floor(colorTempValue * (COLOR_TEMP_GRADIENT.length - 1))];
            const color = colored ? `hsl(${state.attributes.hs_color[0]} ${state.attributes.hs_color[1]}% 50%)` : colorTempColor;
            return iconFactory.getIconVariantBuilder(entity.domain, settings.iconVariant)?.(isOn ? color : undefined);
        } else if (entity.domain === "switch") {
            return iconFactory.getIconVariantBuilder(entity.domain, settings.iconVariant)?.(isOn);
        }
    }

    HA.on('disconnected', () => {
        SD.log(`HomeAssistant disconnected from ${HA.url}`)
    });

    HA.on('error', (error: string) => {
        SD.log(`HomeAssistant error: ${error}`)
    });

    const getSettingValue = <T>(setting: SettingVariable<T>, parentSetting?: SettingVariable<T>): T | undefined =>
        setting.isVariable ? parentSetting?.value : setting.value;

    SD.on('keyPress', async (ev: ActionEventHA) => {
        const { domain, service, state, serviceConfig } = ev.payload.settings;
        const { variableSettings } = await SD.getGlobalSettings();
        const realDomain = getSettingValue(domain, variableSettings?.domain);
        const realService = getSettingValue(service, variableSettings?.service);
        const realState = getSettingValue(state, variableSettings?.state);
        const realServiceConfig = serviceConfig ? Object.fromEntries(serviceConfig.map(config => [config.fieldId, config.value])) : {};
        if (realDomain && realService && realState) {
            SD.log(`${realService} ${realDomain} '${realState}' with config '${JSON.stringify(realServiceConfig)}'`);
            HA.callService(realDomain, realService, { ...realServiceConfig, entity_id: realState });
        }
    })

    SD.on('longKeyPress', (ev: ActionEventHA) => {
        SD.log('Long Key Press', ev);
        const device = ev.device;
        const settings = ev.payload.settings;
        const profile = settings.profile;
        if (profile) {
            SD.log(`Switching to profile '${profile}'`)
            SD.addGlobalSettings({ variableSettings: settings });
            SD.switchToProfile(device, profile);
        }
    })

    SD.on('sendToPlugin', (ev: any) => {
        if ('image' in ev.payload) {
            SD.setImage(ev.context, ev.payload.image);
        }
    })
}

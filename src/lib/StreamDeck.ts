import { EventMap, TypedEventEmitter } from './TypedEventEmitter';
import type { Connectable } from './Utils';

abstract class StreamDeck extends TypedEventEmitter<any> implements Connectable {

    private streamDeckWebsocket: WebSocket;

    protected readonly info: any;
    protected readonly actionInfo: any;
    protected readonly propertyInspectorUUID: string;

    constructor(inPort: string, inPropertyInspectorUUID: string, inRegisterEvent: string, inInfo: string, inActionInfo: string) {
        super();
        this.info = JSON.parse(inInfo);
        this.actionInfo = JSON.parse(inActionInfo);

        this.propertyInspectorUUID = inPropertyInspectorUUID;

        this.streamDeckWebsocket = new WebSocket('ws://localhost:' + inPort);
        this.streamDeckWebsocket.onopen = this.sendAuthentication.bind(this, inRegisterEvent, inPropertyInspectorUUID);
        this.streamDeckWebsocket.onclose = this.emit.bind(this, 'disconnected');
        this.streamDeckWebsocket.onmessage = this.onmessage.bind(this);
    }

    private sendAuthentication(event: string, uuid: string): void {
        this.streamDeckWebsocket.send(JSON.stringify({
            event,
            uuid
        }));
        this.emit('connected', this.actionInfo);
    }

    private onmessage(message: MessageEvent): void {
        const ev = JSON.parse(message.data);
        this.handleMessage(ev);
        this.emit(ev.event, ev);
    }

    protected handleMessage(_ev: any): void {
        // Method to be overwritten in children classes
        // Method not abstract because overwritting is optional 
    }

    protected sendmessage(event: string, message: object): void {
        this.streamDeckWebsocket.send(JSON.stringify({ event, ...message }));
    }

    public isConnected(): boolean {
        return this.streamDeckWebsocket.readyState === WebSocket.OPEN;
    }

    public setSettings(actionSettings: object): void {
        this.sendmessage('setSettings', {
            context: this.propertyInspectorUUID,
            payload: actionSettings
        });
    }

    public async addSettings(actionSettings: object): Promise<void> {
        this.sendmessage('setSettings', {
            context: this.propertyInspectorUUID,
            payload: {
                ...await this.getSettings(),
                ...actionSettings
            }
        });
    }

    public getSettings(context?: string): Promise<any> {
        this.sendmessage('getSettings', {
            context: context || this.propertyInspectorUUID
        });
        return new Promise((res) => this.once('didReceiveSettings', (ev: any) => res(ev?.payload?.settings)));
    }

    public setGlobalSettings(settings: object): void {
        this.sendmessage('setGlobalSettings', {
            context: this.propertyInspectorUUID,
            payload: settings
        });
    }

    public async addGlobalSettings(settings: object): Promise<void> {
        this.sendmessage('setGlobalSettings', {
            context: this.propertyInspectorUUID,
            payload: {
                ...await this.getGlobalSettings(),
                ...settings
            }
        });
    }

    public getGlobalSettings(): Promise<any> {
        this.sendmessage('getGlobalSettings', {
            context: this.propertyInspectorUUID
        });
        return new Promise((res) => this.once('didReceiveGlobalSettings', (ev: any) => res(ev?.payload?.settings)));
    }

    public openUrl(url: string): void {
        this.sendmessage('openUrl', {
            payload: {
                url
            }
        });
    }

    public log(...args: any): void {
        console.log(...args);
        this.sendmessage('logMessage', {
            payload: {
                message: args.join(' ')
            }
        });
    }
}

export class StreamDeckPlugin extends StreamDeck {

    private keyDownDates = new Map<string, number>();

    constructor(inPort: string, inPropertyInspectorUUID: string, inRegisterEvent: string, inInfo: string, inActionInfo: string) {
        super(inPort, inPropertyInspectorUUID, inRegisterEvent, inInfo, inActionInfo);
    }

    protected handleMessage(ev: any): void {
        const context = ev.context;
        if (ev.event === 'keyDown') {
            const timeout = setTimeout(() => {
                this.keyDownDates.delete(context);
                this.emit('longKeyPress', ev);
            }, 300);
            this.keyDownDates.set(context, timeout);
        } else if (ev.event === 'keyUp') {
            if (this.keyDownDates.has(context)) {
                clearTimeout(this.keyDownDates.get(context));
                this.keyDownDates.delete(context);
                this.emit('keyPress', ev);
            }
        }
    }

    public getSettings(context: string): Promise<any> {
        return super.getSettings(context);
    }

    public setTitle(context: string, title: string): void {
        this.sendmessage('setTitle', {
            context,
            payload: {
                title: title,
                target: ['software', 'hardware']
            }
        });
    }

    public setImage(context: string, image: string, state?: number): void {
        this.sendmessage('setImage', {
            context,
            payload: {
                image,
                target: ['software', 'hardware'],
                state
            }
        });
    }

    public setFeedback(context: string, properties: Record<string, any>): void {
        this.sendmessage('setFeedback', {
            context,
            payload: properties
        });
    }

    public setFeedbackLayout(context: string, layout: string): void {
        this.sendmessage('setFeedbackLayout', {
            context,
            payload: {
                layout
            }
        });
    }

    public showAlert(context: string): void {
        this.sendmessage('showAlert', {
            context,
        });
    }

    public showOk(context: string): void {
        this.sendmessage('showOk', {
            context,
        });
    }

    public setState(context: string, state: number): void {
        this.sendmessage('setState', {
            context,
            payload: { state }
        });
    }

    public switchToProfile(device: string, profile: string): void {
        this.sendmessage('switchToProfile', {
            context: this.propertyInspectorUUID,
            device,
            payload: { profile }
        });
    }

    public sendToPI(action: string, context: string, data: object): void {
        this.sendmessage('sendToPropertyInspector', {
            action,
            context,
            payload: data
        });
    }
}


export class StreamDeckPI extends StreamDeck {
    protected devices: Record<string, any>;

    constructor(inPort: string, inPropertyInspectorUUID: string, inRegisterEvent: string, inInfo: string, inActionInfo: string) {
        super(inPort, inPropertyInspectorUUID, inRegisterEvent, inInfo, inActionInfo);
        this.devices = Object.fromEntries(this.info.devices.map((d: any) => [d.id, d]));
    }

    public getSettings(): Promise<any> {
        return super.getSettings();
    }

    public sendToPlugin(data: object): void {
        this.sendmessage('sendToPlugin', {
            action: this.actionInfo.action,
            context: this.propertyInspectorUUID,
            payload: data
        });
    }

    public getDevice(): any {
        return this.devices[this.actionInfo.device]!;
    }
}



export interface ActionEvent {
    action: string;
    event: string;
    context: string;
    device: string;
    payload: {
        settings: any;
        coordinates: {
            column: number;
            row: number;
        }
        state: number;
        userDesiredState: number;
        isInMultiAction: boolean;
    }
}

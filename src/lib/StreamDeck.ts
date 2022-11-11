import { EventEmitter } from "./EventEmitter";

abstract class StreamDeck extends EventEmitter {
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
        this.streamDeckWebsocket.onopen = () => {
            let json = {
                event: inRegisterEvent,
                uuid: inPropertyInspectorUUID
            };
            this.streamDeckWebsocket.send(JSON.stringify(json));
            this.emit("connected", this.actionInfo);
        };
        this.streamDeckWebsocket.onclose = () => this.emit("disconnected");
        this.streamDeckWebsocket.onmessage = this.onmessage.bind(this);
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

    protected sendmessage(message: object): void {
        this.streamDeckWebsocket.send(JSON.stringify(message));
    }

    public isConnected() {
        return this.streamDeckWebsocket.readyState === WebSocket.OPEN;
    }

    public setSettings(actionSettings: object): void {
        this.sendmessage({
            event: "setSettings",
            context: this.propertyInspectorUUID,
            payload: actionSettings
        });
    }

    public async addSettings(actionSettings: object): Promise<void> {
        this.sendmessage({
            event: "setSettings",
            context: this.propertyInspectorUUID,
            payload: {
                ...await this.getSettings(),
                ...actionSettings
            }
        });
    }

    public getSettings(): Promise<any> {
        this.sendmessage({
            event: "getSettings",
            context: this.propertyInspectorUUID
        });
        return new Promise((res) => this.once("didReceiveSettings", (ev: any) => res(ev?.payload?.settings)));
    }

    public setGlobalSettings(settings: object): void {
        this.sendmessage({
            event: "setGlobalSettings",
            context: this.propertyInspectorUUID,
            payload: settings
        });
    }

    public async addGlobalSettings(settings: object): Promise<void> {
        this.sendmessage({
            event: "setGlobalSettings",
            context: this.propertyInspectorUUID,
            payload: {
                ...await this.getGlobalSettings(),
                ...settings
            }
        });
    }

    public getGlobalSettings(): Promise<any> {
        this.sendmessage({
            event: "getGlobalSettings",
            context: this.propertyInspectorUUID
        });
        return new Promise((res) => this.once("didReceiveGlobalSettings", (ev: any) => res(ev?.payload?.settings)));
    }

    public openUrl(url: string): void {
        this.sendmessage({
            event: "openUrl",
            payload: { url }
        });
    }

    public log(...args: any): void {
        console.log(...args);
        this.sendmessage({
            event: "logMessage",
            payload: {
                message: args.join(" ")
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
        if (ev.event === "keyDown") {
            const timeout = setTimeout(() => {
                this.keyDownDates.delete(context);
                this.emit("longKeyPress", ev);
            }, 300);
            this.keyDownDates.set(context, timeout);
        } else if (ev.event === "keyUp") {
            if (this.keyDownDates.has(context)) {
                clearTimeout(this.keyDownDates.get(context));
                this.keyDownDates.delete(context);
                this.emit("keyPress", ev);
            }
        }
    }

    public setTitle(context: string, title: string): void {
        this.sendmessage({
            event: "setTitle",
            context,
            payload: {
                title: title,
                target: ["software", "hardware"]
            }
        });
    }

    public setImage(context: string, image: string): void {
        this.sendmessage({
            event: "setImage",
            context,
            payload: {
                image: image,
                target: ["software", "hardware"],
                state: 0
            }
        });
    }

    public showAlert(context: string): void {
        this.sendmessage({
            event: "showAlert",
            context,
        });
    }

    public showOk(context: string): void {
        this.sendmessage({
            event: "showOk",
            context,
        });
    }

    public setState(context: string, state: number): void {
        this.sendmessage({
            event: "setState",
            context,
            payload: { state }
        });
    }

    public switchToProfile(device: string, profile: string): void {
        this.sendmessage({
            event: "switchToProfile",
            context: this.propertyInspectorUUID,
            device,
            payload: {
                profile: profile
            }
        });
    }

    public sendToPI(action: string, context: string, data: object): void {
        this.sendmessage({
            action: action,
            event: "sendToPropertyInspector",
            context: context,
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

    public sendToPlugin(data: object): void {
        this.sendmessage({
            action: this.actionInfo.action,
            event: "sendToPlugin",
            context: this.propertyInspectorUUID,
            payload: data
        });
    }

    public getDevice(): any {
        return this.devices[this.actionInfo.device]!;
    }
}

export const awaitSDConnection = (sd: StreamDeck) => new Promise<void>((res, rej) => {
    if (sd.isConnected()) {
        res();
    } else {
        sd.once('connected', res);
        sd.once('error', rej)
    }
});

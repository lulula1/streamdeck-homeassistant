import { EventEmitter } from './EventEmitter';
import type { Connectable } from './Utils';

export class HomeAssistant extends EventEmitter implements Connectable {

    private requests: Map<number, Function>;
    private requestIdSequence: number;
    private readonly websocket: WebSocket;
    private readonly accessToken: string;

    constructor(url: string, accessToken: string) {
        super();
        this.requests = new Map();
        this.requestIdSequence = 1;
        this.websocket = new WebSocket(url);
        this.accessToken = accessToken;
        this.websocket.onmessage = (evt) => this.handleMessage(evt);
        this.websocket.onerror = () => this.emit('error', 'Failed to connect to ' + url);
        this.websocket.onclose = this.emit.bind(this, 'close');
    }

    private handleMessage(msg: MessageEvent<any>): void {
        let messageData = JSON.parse(msg.data);

        switch (messageData.type) {
            case 'auth_required':
                this.sendAuthentication();
                break;
            case 'result':
            case 'event':
                if (this.requests.has(messageData.id)) {
                    this.requests.get(messageData.id)!(messageData.result);
                }
                break;
            case 'auth_ok':
                this.emit('connected');
                break;
            case 'auth_failed':
            case 'auth_invalid':
                this.emit('error', messageData.message);
                break;
        }
    }

    private sendAuthentication(): void {
        this.websocket.send(JSON.stringify({
            type: 'auth',
            access_token: this.accessToken
        }));
    }

    private sendCommand(command: Command, callback: Function | null): void {
        if (callback) {
            this.requests.set(command.id, callback);
        }
        this.websocket.send(JSON.stringify(command));
    }

    private nextRequestId(): number {
        return ++this.requestIdSequence;
    }

    public isConnected() {
        return this.websocket.readyState === WebSocket.OPEN;
    }

    public close(): void {
        this.websocket.onclose = null;
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.close();
        }
    }

    public getStates(): Promise<State[]> {
        return new Promise<State[]>((res) => {
            let getStatesCommand = new GetStatesCommand(this.nextRequestId());
            this.sendCommand(getStatesCommand, res);
        });
    }

    public getStatesByDomain(domain: string): Promise<State[]> {
        return this.getStates()
            .then(states => states.filter(state => state.entity_id.startsWith(domain + '.')));
    }

    public getServices(): Promise<DomainServices> {
        const recordToObject = (data: Record<string, any>, keyAttr: string) =>
            Object.entries(data).map(([key, value]) => ({ ...value, [keyAttr]: key }));
        return new Promise((res) => {
            let getServicesCommand = new GetServicesCommand(this.nextRequestId());
            this.sendCommand(getServicesCommand, (services: DomainServices) => {
                res(Object.fromEntries(
                    Object.entries(services)
                        .map(([domain, serviceObj]) =>
                            [domain, recordToObject(serviceObj, 'id')])
                ));
            });
        });
    }

    public getServicesByDomain(domain: string) {
        return this.getServices()
            .then(services => services[domain]);
    }

    public subscribeEvents(): Promise<void> {
        return new Promise((res) => {
            let subscribeEventCommand = new SubscribeEventCommand(this.nextRequestId());
            this.sendCommand(subscribeEventCommand, res);
        });
    }

    public callService(domain: string, service: string, serviceData: Object): Promise<void> {
        return new Promise((res) => {
            let callServiceCommand = new CallServiceCommand(this.nextRequestId(), domain, service, serviceData);
            this.sendCommand(callServiceCommand, res);
        });
    }
}

abstract class Command {
    public readonly id: number;
    public readonly type: string;

    constructor(requestId: number, type: string) {
        this.id = requestId;
        this.type = type;
    }
}

class SubscribeEventCommand extends Command {
    public readonly event_type: string;

    constructor(interactionCount: number) {
        super(interactionCount, 'subscribe_events');
        this.event_type = 'state_changed';
    }
}

class GetStatesCommand extends Command {
    constructor(iterationCount: number) {
        super(iterationCount, 'get_states');
    }
}

class GetServicesCommand extends Command {
    constructor(iterationCount: number) {
        super(iterationCount, 'get_services');
    }
}

class CallServiceCommand extends Command {
    public readonly domain: string;
    public readonly service: string;
    public readonly service_data?: object;

    constructor(iterationCount: number, domain: string, service: string, service_data?: object) {
        super(iterationCount, 'call_service');
        this.domain = domain;
        this.service = service;
        if (service_data) {
            this.service_data = service_data;
        }
    }
}

export class Entity {
    public readonly entityId: string;
    public readonly domain: string;
    public readonly name: string;

    constructor(entityId: string) {
        this.entityId = entityId;
        this.domain = entityId.split('.')[0];
        this.name = entityId.split('.')[1];
    }
};


export interface State {
    entity_id: string;
    state: string;
    attributes: {
        editable: boolean;
        id: string;
        user_id: string;
        entity_picture: string;
        friendly_name: string
    }
    last_changed: string;
    last_updated: string;
    context: {
        id: string;
        parent_id: string;
        user_id: string;
    }
}

export type DomainServices = Record<string, Service[]>;

export interface Service {
    id: string;
    name: string;
    description: string;
    fields: Record<string, any>;
    target?: {
        entity: {
            domain: string;
        }
    }
}

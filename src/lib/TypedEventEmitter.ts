export type EventMap = {
    [key: string]: (...args: any[]) => void | void
}

export interface ITypedEventEmitter<Events extends EventMap> {
    on<E extends keyof Events>(name: E, listener: Events[E]): () => void;
    once<E extends keyof Events>(name: E, listener: Events[E]): () => void;
    hasListener<E extends keyof Events>(name: E): boolean;
    emit<E extends keyof Events>(name: E, ...args: Parameters<Events[E]>): void;
}

export class TypedEventEmitter<Events extends EventMap> implements ITypedEventEmitter<Events> {
    private eventList: Map<keyof Events, PubSub> = new Map();

    public on<E extends keyof Events>(name: E, listener: Events[E]): () => void {
        if (!this.hasListener(name))
            this.eventList.set(name, new PubSub());
        return this.eventList.get(name)!.sub(listener);
    }

    public once<E extends keyof Events>(name: E, listener: Events[E]): () => void {
        const deleteListener = this.on(name, callback as any);
        function callback (...args: any): void {
            listener(...args);
            deleteListener();
        }
        return deleteListener;
    }

    public hasListener<E extends keyof Events>(name: E): boolean {
        return this.eventList.has(name);
    }

    public emit<E extends keyof Events>(name: E, ...args: Parameters<Events[E]>): void {
        this.hasListener(name) && this.eventList.get(name)!.pub(...args);
    }
}

class PubSub {
    private subscribers: Set<Function> = new Set();

    sub (listener: Function): () => void {
        this.subscribers.add(listener);
        return () => { this.subscribers.delete(listener); };
    }

    pub (...data: any): void {
        this.subscribers.forEach((listener) => listener(...data));
    }
}

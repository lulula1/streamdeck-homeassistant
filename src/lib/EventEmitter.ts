export class EventEmitter {
    private eventList: Map<string, PubSub> = new Map();


    public on (name: string, fn: Function): () => void {
        if (!this.eventList.has(name))
            this.eventList.set(name, new PubSub());
        return this.eventList.get(name)!.sub(fn);
    };

    public once (name: string, fn: Function): () => void {
        const deleteFn = this.on(name, callback);
        function callback (...args: any): void {
            fn(...args);
            deleteFn();
        }
        return deleteFn;
    }

    public has (name: string): boolean {
        return this.eventList.has(name);
    }

    public emit (name: string, ...args: any): void {
        this.eventList.has(name) && this.eventList.get(name)!.pub(...args);
    }
}

class PubSub {
    private subscribers: Set<Function> = new Set();

    sub (fn: Function): () => void {
        this.subscribers.add(fn);
        return () => { this.subscribers.delete(fn); };
    }

    pub (...data: any): void {
        this.subscribers.forEach((fn) => fn(...data));
    }
}

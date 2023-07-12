import { Ref, watchEffect } from "vue";
import type { ITypedEventEmitter } from "./TypedEventEmitter";

export type ConnectableEvents = {
    connected: (...args: any) => void;
    disconnected: (...args: any) => void;
    error: (error: string, ...args: any) => void;
}

export interface Connectable extends ITypedEventEmitter<ConnectableEvents> {
    isConnected(): boolean;
}

/**
 * Wait for a ref to have a truthy value.
 * Useful in case of provide/inject of asynchronous values put in a ref.
 * 
 * @param ref The ref to watch after
 * @returns Resolves the truthy value of the ref
 */
export const waitForRef = <T>(ref: Ref<T>) =>
    new Promise<NonNullable<T>>((res, rej) => ref
        ? watchEffect(() => ref.value && res(ref.value!))
        : rej('ref must not be undefined'));

/**
 * Wait for a connectable to be connected.
 * 
 * @param connectable The element to await for its connection
 * @returns Resolves when the connectable is connected, rejects if an error occured
 */
export const waitForConnectable = (connectable: Connectable) =>
    new Promise<void>((res, rej) => {
        if (connectable.isConnected()) {
            res();
        } else {
            connectable.once('connected', res);
            connectable.once('error', rej)
        }
    });

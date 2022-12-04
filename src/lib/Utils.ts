export interface Connectable {
    isConnected(): boolean;
    once(event: 'connected' | 'error', fn: Function): any;
}

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

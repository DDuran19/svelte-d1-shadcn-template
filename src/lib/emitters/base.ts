import { dev } from "$app/environment";

export type Listener<T = any> = (data: T) => Promise<void> | void;

export abstract class BaseEventEmitter<Events extends Record<string, any>> {
    abstract listeners: Map<keyof Events, Set<Listener<any>>>;

    abstract lastEmitTimestamps: Map<keyof Events, number>;
    abstract debounceIntervals: Map<keyof Events, number>;

    on<T extends keyof Events, V extends Events[T]>(
        event: T,
        listener: Listener<V>
    ): void {
        if (!this.listeners) {
            this.listeners = new Map();
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(listener);
    }

    off<T extends keyof Events, V extends Events[T]>(
        event: T,
        listener: Listener<V>
    ): void {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.delete(listener);
        }
    }

    once<T extends keyof Events, V extends Events[T]>(
        event: T,
        listener: Listener<V>
    ): void {
        const onceListener: Listener<V> = (data: V) => {
            this.off(event, listener);
            listener(data);
        };
        this.on(event, onceListener);
    }

    emit<T extends keyof Events, V extends Events[T]>(event: T, data: V): void {
        this._emit(event);
        const listeners = this.listeners.get(event);
        if (listeners && listeners.size > 0) {
            listeners.forEach(async (l) => {
                try {
                    await l(data);
                } catch (error) {
                    console.error("Error in listener:", error);
                }
            });
        }
    }

    private _emit(event: keyof Events) {
        if (dev && import.meta.env.VITE_TRACE_EMIT_STACK === "true") {
            try {
                // @ts-expect-error
                throw new Error(event);
            } catch (error: any) {
                console.error({
                    stack: error.stack,
                });
            }
        }
    }

    debouncedEmit<T extends keyof Events, V extends Events[T]>(
        event: T,
        data: V,
        delay: number = 300
    ): void {
        const currentTime = performance.now();

        // Clear any existing interval for this event
        if (this.debounceIntervals.has(event)) {
            clearInterval(this.debounceIntervals.get(event)!);
            this.debounceIntervals.delete(event); // Ensure cleanup after interval clear
        }

        // Set up an interval to check if enough time has passed to emit the event
        const intervalId = setInterval(() => {
            const now = performance.now();
            if (now - currentTime >= delay) {
                this._debouncedEmitNow(event, data);
                clearInterval(intervalId); // Clear the interval after emitting
                this.debounceIntervals.delete(event); // Cleanup after emission
            }
        }, 10); // Check every 10ms (adjust as needed)

        // Store the intervalId to allow clearing it on subsequent calls
        // @ts-expect-error
        this.debounceIntervals.set(event, intervalId);
    }

    private _debouncedEmitNow<T extends keyof Events, V extends Events[T]>(
        event: T,
        data: V
    ): void {
        this.lastEmitTimestamps.set(event, performance.now());
        this.emit(event, data);
    }
}

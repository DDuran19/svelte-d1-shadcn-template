import { BaseEventEmitter } from "./base";

type AppEvent = {
    loading: boolean;
    fetch_start: null;
    fetch_end: null;
};

class AppEvents extends BaseEventEmitter<AppEvent> {
    static _instance: AppEvents;
    listeners;
    lastEmitTimestamps;
    debounceIntervals;
    constructor() {
        super();
        this.listeners = new Map();
        this.lastEmitTimestamps = new Map();
        this.debounceIntervals = new Map();
    }
    public static get instance(): AppEvents {
        if (!AppEvents._instance) {
            AppEvents._instance = new AppEvents();
        }

        return AppEvents._instance;
    }
}

export const appEvents = AppEvents.instance;

import { goto as svelteGoto } from "$app/navigation";
import { appEvents } from "$lib/emitters/AppEvents";
export async function goto(
    url: string | URL,
    opts?: {
        replaceState?: boolean;
        noScroll?: boolean;
        keepFocus?: boolean;
        invalidateAll?: boolean;
        state?: App.PageState;
    }
): Promise<void> {
    appEvents.debouncedEmit("loading", true);
    await svelteGoto(url, opts)
        .then(() => {
            appEvents.debouncedEmit("loading", false);
        })
        .catch(() => {
            appEvents.debouncedEmit("loading", false);
        });
}

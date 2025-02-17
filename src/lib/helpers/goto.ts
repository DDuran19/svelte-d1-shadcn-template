import { goto as svelteGoto } from "$app/navigation";
import { appEvents } from "$lib/emitters/AppEvents";
export async function goto(
    url: string | URL,
    opts?:
        | {
              replaceState?: boolean | undefined;
              noScroll?: boolean | undefined;
              keepFocus?: boolean | undefined;
              invalidateAll?: boolean | undefined;
              state?: App.PageState | undefined;
          }
        | undefined
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

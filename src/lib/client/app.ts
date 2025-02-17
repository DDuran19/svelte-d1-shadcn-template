import { hc } from "hono/client";
import type { Routes } from "$lib/server/api";
import { appEvents } from "../emitters/AppEvents";

export const modifiedFetch: typeof globalThis.fetch = async (input, init) => {
	try {
		appEvents.emit("fetch_start", null);
		const response = await fetch(input, init);
		return response;
	} finally {
		appEvents.emit("fetch_end", null);
	}
};

export const app = hc<Routes>("/", {
	fetch: modifiedFetch,
});

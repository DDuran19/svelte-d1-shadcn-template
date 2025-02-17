import type { Handle } from "@sveltejs/kit";
import { serverlessContainer } from "./container";
import { runtimeKeys } from "./runtimeKeys";
import { drizzle } from "drizzle-orm/d1/driver";
import * as schemas from "$lib/server/database/d1/tablesAndRelations";

export async function getPlatformOnLocalDev<T>(): Promise<T> {
	if (import.meta.env.DEV) {
		const { getPlatformProxy } = await import("wrangler");
		return (await getPlatformProxy())?.env as T;
	}
	return {} as T;
}
export const injectDependencies: Handle = async ({ event, resolve }) => {
	let env = event.platform?.env;

	if (!env) {
		env = await getPlatformOnLocalDev<App.Platform["env"]>();
	}
	const db = drizzle(env!.D1, { schema: schemas });
	serverlessContainer.injectRuntimeValue(runtimeKeys.db, db);
	serverlessContainer.injectRuntimeValue(runtimeKeys.r2, env!.R2);

	event.locals.db = db;
	event.locals.r2 = env!.R2;
	return resolve(event);
};

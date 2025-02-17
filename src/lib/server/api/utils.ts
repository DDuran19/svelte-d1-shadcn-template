import { serverlessContainer } from "$hooks/container";
import type { Controller } from "./base";
import type { ContextWithEnvironment } from "./types";

export function queryResult<T, E = T>(
	c: ContextWithEnvironment,
	data: { result: App.DefaultResponse<T, E> | null; name: string }
) {
	const { result, name } = data;
	if (!result || !result.success || !result.data) {
		return c.json({
			success: false,
			message: `Failed to fetch ${name}`,
			data: [] as T[],
		});
	}
	return c.json({
		success: true,
		message: `Successfully fetched ${name}`,
		data: result.data,
	});
}

export async function runQuery<T, A extends any[]>(config: {
	queryFn: (...args: A) => Promise<T>;
	args: A;
}): Promise<T | null> {
	const { queryFn, args } = config;

	try {
		return await queryFn(...args);
	} catch {
		return null;
	}
}

export function getRoutes<T extends Controller>(
	Class: Helpers.Constructor<T>
): ReturnType<T["routes"]> {
	// @ts-expect-error
	return serverlessContainer.resolve(Class).routes();
}

export function getInstance<T>(Class: Helpers.Constructor<T>): T {
	return serverlessContainer.resolve(Class);
}

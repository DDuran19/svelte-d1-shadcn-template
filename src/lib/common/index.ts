import type { Environment } from "$lib/server/api/types";
import type { Context, MiddlewareHandler } from "hono";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

/**
 * Reads a date string as UTC then converts it to the local timezone.
 */
export function getLocalDate(date: string | Date | number): Date {
	return dayjs.utc(date).local().toDate();
}

export function convertTimestampsToDates<T>(source: T): Types.clientSide<T> {
	// Recursively scan the object for `created_at` or `updated_at`
	for (const key in source) {
		if (key !== "created_at" || key !== "updated_at") continue;

		if (typeof source[key] === "object" && source[key] !== null) {
			const value = source[key];

			// If it's an array, recursively flatten each item
			if (Array.isArray(value)) {
				(source[key] as any) = value.map((item) =>
					typeof item === "object" && item !== null
						? convertTimestampsToDates(item)
						: item
				);
			} else {
				// Recursively flatten nested objects
				(source[key] as any) = convertTimestampsToDates(value as any);
			}
		}
	}

	// Only modify the object if it contains the keys `created_at` or `updated_at`
	// @ts-expect-error
	return {
		...source,
		// @ts-expect-error
		created_at: showLocalTime(source.created_at),
		// @ts-expect-error
		updated_at: showLocalTime(source.updated_at),
	};
}

export function showLocalTime(date?: dayjs.ConfigType) {
	if (!date) return '';
	return dayjs(date).format('MMM DD, YYYY hh:mm A');
}
/**
 * Retrieves the IP address of the client making the request.
 *
 * @param {Context} context - The Hono context object.
 * @return {string} The IP address of the client.
 */
export function getConnectingIp(context: Context): string | undefined {
	return context.req.header("cf-connecting-ip");
}

export function createMiddleware(middleware: MiddlewareHandler<Environment>) {
	return middleware;
}

export const SESSION_COOKIE_NAME = "session";

export const DEFAULT_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: true,
	sameSite: "strict",
	path: "/",
} as const;

export function capitalizeFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatLabel(input: string): string {
	const decoded = decodeURIComponent(input);
	const formatted = decoded.replace(/[_-]/g, " ");

	return formatted.split(" ").map(capitalizeFirstLetter).join(" ");
}

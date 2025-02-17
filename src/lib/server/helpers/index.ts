import type { Environment } from "../api/types";
import type { Context, MiddlewareHandler } from "hono";

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

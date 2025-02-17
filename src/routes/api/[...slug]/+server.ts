import { app } from "$lib/server/api";
import type { RequestHandler } from "@sveltejs/kit";

function injectPlatformAndLocals(locals: App.Locals, platform?: App.Platform) {
	return platform?.env ? { ...platform.env, locals } : { locals };
}

function handleRequest(
	method: "request" | "fetch",
	{
		request,
		platform,
		locals,
	}: { request: Request; platform?: App.Platform; locals: App.Locals }
) {
	const context = injectPlatformAndLocals(locals, platform);
	return method === "request"
		? app.request(request, {}, context)
		: app.fetch(request, context);
}

export const GET: RequestHandler = (context) =>
	handleRequest("request", context);
export const PUT: RequestHandler = (context) =>
	handleRequest("request", context);
export const DELETE: RequestHandler = (context) =>
	handleRequest("fetch", context);
export const POST: RequestHandler = (context) =>
	handleRequest("fetch", context);
export const PATCH: RequestHandler = (context) =>
	handleRequest("fetch", context);
export const fallback: RequestHandler = (context) =>
	handleRequest("fetch", context);

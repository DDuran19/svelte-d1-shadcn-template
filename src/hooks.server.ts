import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { injectDependencies } from "./hooks/injectBindings";
import { getInstance } from "$lib/server/api/utils";
import { LoginGuard } from "$lib/server/api/middlewares/login.guard";

export const handle: Handle = sequence(
	injectDependencies,
	getInstance(LoginGuard).injectUser
);

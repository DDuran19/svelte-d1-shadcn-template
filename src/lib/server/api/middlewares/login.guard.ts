import {
	createMiddleware,
	DEFAULT_COOKIE_OPTIONS,
	SESSION_COOKIE_NAME,
} from "$lib/common";
import { getSession } from "$lib/server/database/d1/sessions/queries";
import type { Handle } from "@sveltejs/kit";
import { ServerlessInjectable } from "elea-di";
import { deleteCookie, getCookie } from "hono/cookie";

export class LoginGuard extends ServerlessInjectable {
	get allowLoggedInUsers() {
		return createMiddleware(async (c, n) => {
			const session_id = getCookie(c, SESSION_COOKIE_NAME);
			if (!session_id) {
				return c.json({
					success: false,
					message: 'No session found',
					data: null,
				});
			}

			const user = c.env.locals.user;

			if (user) {
				c.set('current_user_id', user.id);
				return await n();
			}

			const session_data_response = await getSession(c.env.locals.db, {
				session_id,
			});

			if (
				!session_data_response ||
				!session_data_response.success ||
				!session_data_response.data
			) {
				deleteCookie(c, SESSION_COOKIE_NAME);
				return c.json({
					success: false,
					message:
						session_data_response?.message || 'No session found',
					data: null,
				});
			}

			c.set('session_data', session_data_response.data.session_data);
			c.set('user', session_data_response.data.user);
			c.set('current_user_name', session_data_response.data.user_name);
			c.set('current_user_id', session_data_response.data.user.id);

			return await n();
		});
	}

	get injectUser(): Handle {
		return async ({ event, resolve }) => {
			const session_id = event.cookies.get(SESSION_COOKIE_NAME);

			if (!session_id) {
				return resolve(event);
			}

			const session_data = await getSession(event.locals.db, {
				session_id,
			});

			if (!session_data || !session_data.data) {
				event.cookies.delete(
					SESSION_COOKIE_NAME,
					DEFAULT_COOKIE_OPTIONS
				);
				return resolve(event);
			}

			event.locals.user = session_data.data.user;
			event.locals.session_data = session_data.data.session_data;
			return await resolve(event);
		};
	}

	get allowSuperAdmin() {
		return createMiddleware(async (c, n) => {
			const user = c.env.locals.user;
			if (user?.super_admin) return await n();
			return c.json({
				success: false,
				message: "You are not permitted to access this resource.",
				data: null,
			});
		});
	}
}

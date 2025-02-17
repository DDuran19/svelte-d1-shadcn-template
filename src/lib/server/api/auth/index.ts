import { serverlessContainer } from "$hooks/container";
import {
	authLoginValidator,
	authRegisterValidator,
} from "$lib/common/validators/auth";
import {
	createSession,
	getSession,
} from "$lib/server/database/d1/sessions/queries";
import { login, register } from "$lib/server/database/d1/users/queries";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Controller } from "../base";
import { LoginGuard } from "../middlewares/login.guard";
import { zValidator } from "@hono/zod-validator";
import { DEFAULT_COOKIE_OPTIONS, SESSION_COOKIE_NAME } from "$lib/common";

export class Auth extends Controller {
	constructor() {
		super();
	}
	routes() {
		return this.controller
			.post("/", zValidator("json", authLoginValidator), async (c) => {
				const valid = c.req.valid("json");

				const result = await login(c.env.locals.db, {
					email: valid.email,
					password: valid.password,
				});

				if (!result.success || !result.data) {
					return c.json({
						success: false,
						message: result.message,
						data: null,
					});
				}

				const createSessionResponse = await createSession(
					c.env.locals.db,
					{
						user_id: result.data.id,
						request_info: {
							headers: c.req.header(),
						},
						user_name: `${result.data.first_name} ${result.data.last_name}`,
					}
				);
				if (
					!createSessionResponse.success ||
					!createSessionResponse.data
				) {
					return c.json({
						success: false,
						message: createSessionResponse.message,
						data: null,
					});
				}

				setCookie(
					c,
					SESSION_COOKIE_NAME,
					createSessionResponse.data.id,
					DEFAULT_COOKIE_OPTIONS
				);

				return c.json({
					success: true,
					message: "Successfully logged in",
					data: result.data,
				});
			})
			.post(
				"/register",
				zValidator("json", authRegisterValidator),
				async (c) => {
					const valid = c.req.valid("json");

					const result = await register(c.env.locals.db, {
						email: valid.email,
						password: valid.password,
						passwordConfirm: valid.passwordConfirm,
					});

					if (!result.success || !result.data) {
						return c.json({
							success: false,
							message: result.message,
							data: null,
						});
					}
					const createSessionResponse = await createSession(
						c.env.locals.db,
						{
							user_id: result.data.id,
							request_info: {
								headers: c.req.header(),
							},
							user_name: `${result.data.first_name} ${result.data.last_name}`,
						}
					);

					if (
						!createSessionResponse.success ||
						!createSessionResponse.data
					) {
						return c.json({
							success: false,
							message: createSessionResponse.message,
							data: null,
						});
					}

					setCookie(
						c,
						SESSION_COOKIE_NAME,
						createSessionResponse.data.id,
						DEFAULT_COOKIE_OPTIONS
					);
					return c.json({
						success: true,
						message: "Successfully registered",
						data: result.data,
					});
				}
			)
			.post("/refresh", async (c) => {
				const createSessionResponse = await getSession(
					c.env.locals.db,
					{
						session_id: getCookie(c, SESSION_COOKIE_NAME) || "",
					},
					true
				);
				return c.json({
					success: createSessionResponse.success,
					message: createSessionResponse.message,
					data: null,
				});
			})
			.use(serverlessContainer.resolve(LoginGuard).allowLoggedInUsers)
			.delete("/", async (c) => {
				deleteCookie(c, SESSION_COOKIE_NAME);
				return c.json({
					success: true,
					message: "Successfully logged out",
					data: null,
				});
			});
	}
}

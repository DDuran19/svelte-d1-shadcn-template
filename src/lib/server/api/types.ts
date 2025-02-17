import type { Context, Env } from "hono";

export type Environment = Env & {
	Bindings: {
		ENV_TYPE: "dev" | "prod" | "stage";
		locals: App.Locals;
	};
	Variables: {
		dev: boolean;
		user: Types.user;
		current_user_name: string;
		session_data: Types.Session_data;
		current_user_id: Types.user_id;
		_permissions: Types.permission[];
	};
};

export type ContextWithEnvironment = Context<Environment>;

import { eq } from "drizzle-orm/sqlite-core/expressions";
import { users } from "./table";
import bcryptjs from "bcryptjs";
import { errorOnDbConnection, getUtcDate } from "../helpers";

export type GetEmailAvailabilityParams = {
	email: string;
};

export async function getEmailAvailability(
	db: Types.db,
	data: GetEmailAvailabilityParams
): Promise<App.DefaultResponse<boolean>> {
	const { email } = data;

	let error = false;
	const result = await db.query.users
		.findFirst({
			where: eq(users.email, email),
		})
		.catch(() => {
			error = true;
			return undefined;
		});

	if (error) {
		return errorOnDbConnection<boolean, boolean>(false);
	}

	if (!result) {
		return {
			success: false,
			message: "Email is not available",
			data: false,
		};
	}
	return {
		success: true,
		message: "Email is available",
		data: true,
	};
}

export type LoginParams = {
	email: string;
	password: string;
};
export type User = typeof users.$inferSelect;
export async function login(
	db: Types.db,
	data: LoginParams
): Promise<App.DefaultResponse<Types.user | null>> {
	const { email, password } = data;
	let error = false;

	const result = await db.query.users
		.findFirst({
			where: eq(users.email, email.toLowerCase()),
		})
		.catch(() => {
			error = true;
			return undefined;
		});

	if (error) {
		return errorOnDbConnection<Types.user>();
	}

	if (!result) {
		return {
			success: false,
			message: "User not found",
			data: null,
		};
	}

	const isValidPassword = await bcryptjs.compare(
		password,
		result.hashed_password
	);

	if (!isValidPassword) {
		return {
			success: false,
			message: "Invalid password",
			data: null,
		};
	}

	return {
		success: true,
		message: "Login successful",
		data: result,
	};
}

export type RegisterParams = {
	email: string;
	password: string;
	passwordConfirm: string;
};
export async function register(
	db: Types.db,
	data: RegisterParams
): Promise<App.DefaultResponse<Types.user | null>> {
	const { email, password, passwordConfirm } = data;

	if (password !== passwordConfirm) {
		return {
			success: false,
			message: "Passwords do not match",
			data: null,
		};
	}
	let error = false;

	const emailAvailability = await getEmailAvailability(db, {
		email,
	});

	if (!emailAvailability.data) {
		return {
			success: false,
			message: "Email is not available",
			data: null,
		};
	}

	const hashed_password = await bcryptjs.hash(password, 10);

	const result = await db
		.insert(users)
		.values({
			email: email.toLowerCase(),
			hashed_password,
		})
		.returning()
		.catch(() => {
			error = true;
			return undefined;
		});

	if (error) {
		return errorOnDbConnection<Types.user>();
	}

	if (!result) {
		return {
			success: false,
			message: "Error registering user",
			data: null,
		};
	}

	return {
		success: true,
		message: "User registered successfully",
		data: result[0],
	};
}

export type UpdateUserParams = {
	user_id: User["id"];
	updated_by: User["id"];
	first_name?: User["first_name"];
	last_name?: User["last_name"];
};

export type ChangePasswordParams = {
	user_id: User["id"];
	updated_by: User["id"];
	current_password: string;
	new_password: string;
};

export async function changeUserPassword(
	db: Types.db,
	data: ChangePasswordParams
): Promise<App.DefaultResponse<boolean, boolean>> {
	const { user_id, updated_by, current_password, new_password } = data;
	let error = false;

	const user = await db.query.users
		.findFirst({
			where: eq(users.id, user_id),
		})
		.catch(() => {
			error = true;
			return undefined;
		});

	if (error) {
		return errorOnDbConnection<boolean, boolean>(false);
	}

	if (!user) {
		return {
			success: false,
			message: 'User not found',
			data: false,
		};
	}

	const isValidPassword = await bcryptjs.compare(
		current_password,
		user.hashed_password
	);

	if (!isValidPassword) {
		return {
			success: false,
			message: 'Invalid password',
			data: false,
		};
	}

	const result = await db
		.update(users)
		.set({
			hashed_password: await bcryptjs.hash(new_password, 10),
			updated_at: getUtcDate(),
			updated_by_id: updated_by,
		})
		.where(eq(users.id, user_id))
		.returning()
		.catch(() => {
			error = true;
			return undefined;
		});

	if (error) {
		return errorOnDbConnection(false);
	}

	if (!result || result.length === 0) {
		return {
			success: false,
			message: 'Error changing password',
			data: false,
		};
	}

	return {
		success: true,
		message: 'Password changed successfully',
		data: true,
	};
}

export type BypassChangePasswordParams = {
	user_id: User['id'];
	updated_by: User['id'];
	new_password: string;
};
export async function bypassChangePassword(
	db: Types.db,
	data: ChangePasswordParams
): Promise<App.DefaultResponse<boolean>> {
	const { user_id, updated_by, new_password } = data;
	let error = false;

	const result = await db
		.update(users)
		.set({
			hashed_password: await bcryptjs.hash(new_password, 10),
			updated_at: getUtcDate(),
			updated_by_id: updated_by,
		})
		.where(eq(users.id, user_id))
		.returning()
		.catch(() => {
			error = true;
			return undefined;
		});

	if (error) {
		return errorOnDbConnection<boolean, boolean>(false);
	}

	if (!result || result.length === 0) {
		return {
			success: false,
			message: 'Error changing password',
			data: false,
		};
	}

	return {
		success: true,
		message: 'Password changed successfully',
		data: true,
	};
}

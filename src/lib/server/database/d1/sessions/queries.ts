import { and, eq, gt } from "drizzle-orm";
import { sessions } from "./table";
import {
	deleteHashedPassword,
	elapsedTimeReached,
	errorOnDbConnection,
	flattenMetadata,
	getUtcDate,
	systemMetaDataQuery,
	users,
} from "../helpers";

type CreateSessionParams = {
	user_id: string;
	user_name: string;
	request_info: object;
};

export async function createSession(db: Types.db, data: CreateSessionParams) {
	const { user_id, user_name, request_info } = data;

	const session_data = getSessionData({ user_id });

	let error = false;
	const result = await db
		.insert(sessions)
		.values({
			user_id,
			user_name,
			request_info,
			session_data,
			created_by_id: user_id,
			updated_by_id: user_id,
		})
		.returning({
			session_data: sessions.session_data,
			user_name: sessions.user_name,
			id: sessions.id,
		})
		.catch((e: any) => {
			error = true;
			console.log('createSession: error', e);
			return undefined;
		});

	if (error) return errorOnDbConnection();

	if (!result || !result.length) {
		return {
			success: false,
			message: 'Error creating session',
			data: null,
		};
	}
	return {
		success: true,
		message: 'Session created',
		data: result[0],
	};
}

type GetSessionParams = { session_id: string };
type Session = {
	session_data: Types.Session_data;
	user_name: string;
	user: Types.user;
};
export async function getSession(
	db: Types.db,
	data: GetSessionParams,
	refresh: boolean = false
): Promise<App.DefaultResponse<Session, null>> {
	const { session_id } = data;

	let error = false;

	const result = await db.query.sessions
		.findFirst({
			where: and(
				eq(sessions.id, session_id),
				eq(sessions.active, true),
				gt(sessions.expires_at, getUtcDate())
			),
			columns: {
				session_data: true,
				user_id: true,
				last_updated_at: true,
			},
			with: {
				user: {
					with: {
						...systemMetaDataQuery,
					},
				},
			},
		})
		.catch(() => {
			error = true;
			return undefined;
		});

	if (error) return errorOnDbConnection<Session, null>();

	if (!result) {
		return {
			success: false,
			message: 'Session not found',
			data: null,
		};
	}

	const timeToUpdate = elapsedTimeReached(result.last_updated_at, 2, 'hours');
	const user = flattenMetadata(result.user);

	const processedUser = deleteHashedPassword(user) as Types.user;
	if (timeToUpdate || refresh) {
		return updateSessionData(db, {
			user_id: result.user_id,
			session_id,
			user: processedUser,
			user_name: `${user.first_name} ${user.last_name}`,
		});
	}

	return {
		success: true,
		message: 'Session found',
		data: {
			session_data: result.session_data as Types.Session_data,
			user_name: `${user.first_name} ${user.last_name}`,
			user: processedUser,
		},
	};
}

export async function deleteSession(db: Types.db, user_id: Types.user_id) {
	await db
		.delete(sessions)
		.where(eq(sessions.user_id, user_id))
		.catch(() => []);
}

type LogOutParams = { user_id: Types.user_id; session_id: string };
export async function logoutsession(db: Types.db, data: LogOutParams) {
	const { user_id, session_id } = data;
	let error = false;

	const result = await db
		.update(sessions)
		.set({
			updated_at: getUtcDate(),
			updated_by_id: user_id,
			active: false,
		})
		.where(and(eq(sessions.id, session_id), eq(sessions.user_id, user_id)))
		.returning()
		.catch(() => {
			error = true;
			return undefined;
		});

	if (error) return errorOnDbConnection();

	if (!result || !result.length) {
		return {
			success: false,
			message: 'Error logging out session',
			data: false,
		};
	}

	return {
		success: true,
		message: 'Session logged out',
		data: true,
	};
}

type UpdateSessionDataParams = {
	user_id: Types.user_id;
	session_id: string;
	user_name: string;
	user: Types.user;
};

export async function updateSessionData(
	db: Types.db,
	data: UpdateSessionDataParams
): Promise<App.DefaultResponse<Session, null>> {
	const { user_id, session_id, user } = data;
	if (!user_id) return errorOnDbConnection<Session, null>();

	const session_data = getSessionData({ user_id });

	let error = false;
	const result = await db
		.update(sessions)
		.set({
			updated_at: getUtcDate(),
			updated_by_id: user_id,
			session_data,
			user_name: `${user.first_name} ${user.last_name}`,
		})
		.where(and(eq(sessions.id, session_id), eq(sessions.user_id, user_id)))
		.returning({ session_data: sessions.session_data })
		.catch(() => {
			error = true;
			return undefined;
		});

	if (error) return errorOnDbConnection<Session, null>();

	if (!result || !result.length) {
		return {
			success: false,
			message: 'Error updating session data',
			data: null,
		};
	}

	return {
		success: true,
		message: 'Session data updated',
		data: {
			session_data: result[0].session_data,
			user,
			user_name: `${user.first_name} ${user.last_name}`,
		},
	};
}

// Utils
function getSessionData(config: {
	user_id: Types.user_id;
	super_admin?: boolean;
}): Types.Session_data {
	const { super_admin } = config;
	if (super_admin) return { super_admin: true };
	return {};
}

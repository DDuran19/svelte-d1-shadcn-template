import { setContext, getContext } from 'svelte';
import Dexie, { Entity, liveQuery, type EntityTable } from 'dexie';

const dbKey = Symbol('database');
const session_data_key = 'session_data';

export type LocalData = {
	userId: Types.user_id;
	session_data: Types.Session_data;
};

export type UpdateSessionParams = {
	session_data: Types.Session_data;
	user: Types.user | undefined;
};

class SessionDataEntity extends Entity<LocalDatabase> {
	key = 'session_data';
	data!: Types.Session_data;
	user: Types.user | undefined = undefined;
}

class LocalDatabase extends Dexie {
	session_data!: EntityTable<SessionDataEntity>;

	session = liveQuery(async () => {
		const session = await this._getSession();
		if (!session) {
			return null;
		}
		return session.data;
	});
	user = liveQuery(async () => {
		const session = await this._getSession();
		if (!session) {
			return undefined;
		}
		return session.user;
	});


	constructor() {
		super('local_db');
		this.version(1).stores({
			session_data: 'key, selected_company_id, selected_branch_id, user',
		});
		this.session_data.mapToClass(SessionDataEntity);
		this.updateSessionData = this.updateSessionData.bind(this);
		this._getSession = this._getSession.bind(this);
	}

	private async _getSession() {
		const [session] = await this.session_data.toArray().catch(() => []);

		if (!session) {
			return null;
		}

		return session;
	}
	async updateSessionData(data: UpdateSessionParams) {
		try {
			const {
				session_data,
				user,
			} = data;

			if (!session_data) {
				return null;
			}

			await this.session_data.put({
				data: session_data,
				key: session_data_key,
				user,
			});
			return session_data;
		} catch (error) {
			console.log(error);
			return null;
		}
	}
}

export const db = new LocalDatabase();

export function setLocalDatabaseContext() {
	return setContext(dbKey, db);
}

export function getLocalDatabaseContext() {
	return getContext<ReturnType<typeof setLocalDatabaseContext>>(dbKey);
}

import { setContext, getContext } from "svelte";
import Dexie, { liveQuery, type Table } from "dexie";
import { replaceToast, showToast } from "$lib/components/ui/sonner";
import { goto } from "$lib/helpers/goto";
import { db } from "$lib/contexts/database.svelte";
import { app } from "$lib/client/app";

export interface User {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	username: string;
	status: boolean;
	description: string;
	thumbnail: string;
	created_by: string;
	updated_by: string;
	created_at: string;
	updated_at: string;
	roles: string[];
	permissions: string[];
	allowed_branches: string[];
}

export class LocalEmployeeDb extends Dexie {
	_users: Table<User>;
	users = liveQuery(async () => {
		return await this._users.toArray();
	});
	user = liveQuery(async () => {
		const activeUser = (
			await this.table("activeUser")
				.toArray()
				.catch(() => [])
		)[0]?.id;
		if (!activeUser) {
			return null;
		}
		const users = await this._users
			.where("id")
			.equals(activeUser)
			.toArray();
		return users[0];
	});

	constructor(version: number) {
		super("local_db");
		this.version(version).stores({
			activeUser: "id",
			users: "id, first_name, last_name, email, username, status, description, thumbnail, created_by, updated_by, created_at, updated_at, *roles, *permissions, *allowed_branches",
		});
		this._users = this.table("users");
	}

	async login(user: User) {
		// Local Operations
		await this.table("activeUser").clear();
		await this.table("activeUser").add({ id: user.id });
		await this._users.clear();
		await this._users.add(user);
	}
	async logout() {
		// Local Operations
		let toast = showToast("loading", "Logging out...");
		await this.table("activeUser").clear();
		await this._users.clear();
		await db.session_data.clear();

		// Remote Operations
		await app.api.auth
			.$delete({})
			.then(async (res) => {
				const result = await res.json();
				toast = replaceToast(toast, {
					type: result.success ? "success" : "error",
					message: result.message,
				});

				result.success && goto("/login");
			})
			.catch((err) => {
				console.error(err);
				toast = showToast("error", "Logout failed, please try again");
			});
	}
}

const key = Symbol("db");

export function setLocalEmployeeDb() {
	return setContext(key, new LocalEmployeeDb(1));
}

export function getLocalEmployeeDb() {
	return getContext<ReturnType<typeof setLocalEmployeeDb>>(key);
}

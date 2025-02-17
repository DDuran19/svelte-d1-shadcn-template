type LocalStorageSchema = {
	selected_company_id: string;
	selected_branch_id: string;
	sidebar_state: 'collapsed' | 'expanded';
	sidebar_is_mobile: boolean;
	low_network_mode: boolean;
};

class LocalStorageManager<T = LocalStorageSchema> {
	static _instance: LocalStorageManager<LocalStorageSchema>;
	constructor() {
		return new Proxy(this, {
			get: (target, prop) => {
				// Check if localStorage is available, if not, return undefined,

				if (!window || !window.localStorage) return undefined;
				return target[prop as keyof typeof target];
			},
		});
	}
	static get instance(): LocalStorageManager<LocalStorageSchema> {
		if (!LocalStorageManager._instance) {
			LocalStorageManager._instance = new LocalStorageManager();
		}
		return LocalStorageManager._instance;
	}

	/**
	 * Sets an item in local storage.
	 * @param key - The key under which the value is stored.
	 * @param value - The value to store, which can be of any type.
	 */
	setItem<K extends keyof T, V extends T[K]>(key: K, value: V): void {
		const serializedValue = JSON.stringify(value);
		localStorage.setItem(key as string, serializedValue);
	}

	/**
	 * Gets an item from local storage and parses it to the specified type.
	 * @param key - The key of the item to retrieve.
	 * @returns The parsed value from storage, or undefined if the item doesn't exist.
	 */
	getItem<K extends keyof T, V extends T[K]>(key: K): V | undefined {
		const serializedValue = localStorage.getItem(key as string);
		if (serializedValue === null) {
			return undefined;
		}
		try {
			return JSON.parse(serializedValue) as V;
		} catch (e) {
			console.error(
				`Error parsing value from localStorage for key "${String(
					key
				)}":`,
				e
			);
			return undefined;
		}
	}

	/**
	 * Sets an item in local storage and updates the cookie.
	 * @param key - The key under which the value is stored.
	 * @param value - The value to store, which can be of any type.
	 */
	setItemAndCookie<K extends keyof T, V extends T[K]>(key: K, value: V) {
		this.setItem(key, value);

		// Safely encode the key and value for cookie storage
		const encodedKey = encodeURIComponent(String(key));
		const encodedValue = encodeURIComponent(String(value));

		// Update the document cookie (this does not remove existing cookies)
		document.cookie = `${encodedKey}=${encodedValue}; path=/; SameSite=Lax`;
	}

	/**
	 * Removes an item from local storage.
	 * @param key - The key of the item to remove.
	 */
	removeItem(key: keyof T): void {
		localStorage.removeItem(key as string);
	}

	/**
	 * Removes an item from local storage and updates the cookie.
	 * @param key - The key of the item to remove.
	 */
	removeItemAndCookie(key: keyof T) {
		this.removeItem(key);
		const encodedKey = encodeURIComponent(String(key));
		document.cookie = `${encodedKey}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
	}

	/**
	 * Clears all items from local storage.
	 */
	clear(): void {
		localStorage.clear();
	}

	/**
	 * Checks if an item exists in local storage.
	 * @param key - The key to check in local storage.
	 * @returns True if the item exists, false otherwise.
	 */
	hasItem(key: keyof T): boolean {
		return localStorage.getItem(key as string) !== undefined;
	}
}

export function ls() {
	return LocalStorageManager.instance;
}

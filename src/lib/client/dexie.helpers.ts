/** Check if storage is persisted already.
  @returns {Promise<boolean>} Promise resolved with true if current origin is
  using persistent storage, false if not, and undefined if the API is not
  present.
*/
export async function isStoragePersisted(): Promise<boolean | undefined> {
	return navigator.storage && navigator.storage.persisted
		? await navigator.storage.persisted()
		: undefined;
}

/** Tries to convert to persisted storage.
    @returns {Promise<boolean>} Promise resolved with true if successfully
    persisted the storage, false if not, and undefined if the API is not present.
  */
export async function persist(): Promise<boolean | undefined> {
	return navigator.storage && navigator.storage.persist
		? await navigator.storage.persist()
		: undefined;
}

/** Queries available disk quota.
    @see https://developer.mozilla.org/en-US/docs/Web/API/StorageEstimate
    @returns {Promise<{quota: number, usage: number}>} Promise resolved with
    {quota: number, usage: number} or undefined.
  */
export async function showEstimatedQuota(): Promise<
	StorageEstimate | undefined
> {
	return navigator.storage && navigator.storage.estimate
		? await navigator.storage.estimate()
		: undefined;
}

/** Tries to persist storage without ever prompting user.
    @returns {Promise<string>}
      "never" In case persisting is not ever possible. Caller don't bother
        asking user for permission.
      "prompt" In case persisting would be possible if prompting user first.
      "persisted" In case this call successfully silently persisted the storage,
        or if it was already persisted.
  */
export async function tryPersistWithoutPromtingUser(): Promise<string> {
	if (!navigator.storage || !navigator.storage.persisted) {
		return "never";
	}
	let persisted = await navigator.storage.persisted();
	if (persisted) {
		return "persisted";
	}
	if (!navigator.permissions || !navigator.permissions.query) {
		return "prompt"; // It MAY be successful to prompt. Don't know.
	}
	const permission = await navigator.permissions.query({
		name: "persistent-storage",
	});
	if (permission.state === "granted") {
		persisted = await navigator.storage.persist();
		if (persisted) {
			return "persisted";
		} else {
			throw new Error("Failed to persist");
		}
	}
	if (permission.state === "prompt") {
		return "prompt";
	}
	return "never";
}

/**
 * Initializes the storage persistence process by attempting to persist storage
 * without prompting the user. Logs the outcome based on whether storage was
 * persisted silently, if prompting the user is a possibility, or if persistence
 * is not possible.
 */
export async function initStoragePersistence(): Promise<string> {
	const persist = await tryPersistWithoutPromtingUser();
	switch (persist) {
		case "never":
			console.log("Not possible to persist storage");
			break;
		case "persisted":
			console.log("Successfully persisted storage silently");
			break;
		case "prompt":
			console.log(
				"Not persisted, but we may prompt user when we want to."
			);
			break;
	}

	return persist;
}

/** Prompts the user to enable storage persistence if not already persisted.
  @returns {Promise<boolean>} Promise resolved with true if storage is persisted after prompting, false if not.
*/
export async function promptUserToPersistStorage(): Promise<boolean> {
	// First, check if storage is already persisted
	const isPersisted = await isStoragePersisted();
	if (isPersisted) {
		console.log("Storage is already persisted.");
		return true;
	}

	// If not persisted, try to silently persist
	const persistenceResult = await tryPersistWithoutPromtingUser();
	if (persistenceResult === "persisted") {
		console.log(
			"Storage was successfully persisted without prompting the user."
		);
		return true;
	} else if (persistenceResult === "never") {
		console.log("Storage persistence is not possible.");
		return false;
	}

	// If we reach here, we need to prompt the user for persistence
	const userPermission = confirm(
		"Would you like to enable storage persistence for better performance?"
	);
	if (userPermission) {
		const persisted = await persist();
		if (persisted) {
			console.log(
				"User has granted permission, and storage is now persisted."
			);
			return true;
		} else {
			console.log(
				"User granted permission, but storage persistence failed."
			);
			return false;
		}
	} else {
		console.log("User declined the storage persistence prompt.");
		return false;
	}
}

export default initStoragePersistence;

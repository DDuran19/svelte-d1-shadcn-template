// Default format would be:
// action - scope - table - field (optional)

type actions = 'create' | 'read' | 'list' | 'update' | 'delete';
type scope = 'own' | 'within_branch' | 'within_company' | 'other';

type field = string;

export type AppPermission =
	| `${actions}-${scope}-${Helpers.Table}`
	| `${actions}-${scope}-${Helpers.Table}-${field}`;
export type ProtectParams = {
	permissions: AppPermission[];
	requiredPermissions: AppPermission[];
	raiseError?: Error | boolean;
	superAdmin?: boolean;
	condition?: (permissions: AppPermission[]) => boolean;
};

export class PermissionError extends Error {
	constructor(message: string) {
		super(message);
	}
}
export function protect(params: ProtectParams): boolean {
	const {
		permissions,
		requiredPermissions,
		raiseError = false,
		superAdmin,
		condition,
	} = params;

	if (superAdmin) {
		return true;
	}

	if (condition && !condition(permissions)) {
		return false;
	}

	if (
		requiredPermissions.every((permission) =>
			permissions.includes(permission)
		)
	) {
		return true;
	}

	if (typeof raiseError === 'boolean' && raiseError) {
		throw new PermissionError(
			'You do not have permission to perform this action'
		);
	}

	if (raiseError instanceof Error) {
		throw raiseError;
	}
	return false;
}

// User Permissions

export const readOwnUsers: AppPermission = 'read-own-users';
export const updateOwnUsers: AppPermission = 'update-own-users';
export const deleteOwnUsers: AppPermission = 'delete-own-users';

export const availablePermissions = {
	readOwnUsers,
	updateOwnUsers,
	deleteOwnUsers,
};

// ---- * ROLE PERMISSIONS * ---- //

export const userPermissions = [readOwnUsers, updateOwnUsers, deleteOwnUsers];

export const defaultPermissions = {
	user: userPermissions,
};

import { createMiddleware } from '$lib/common';
import * as p from '$lib/permissions';
import type { ContextWithEnvironment } from '../types';
import { ServerlessInjectable } from 'elea-di';
import { getCookie } from 'hono/cookie';

export class PermissionService extends ServerlessInjectable {
	constructor() {
		super();

		this.requirePermissions = this.requirePermissions.bind(this);
		this.protect = this.protect.bind(this);
	}
	public readonly availablePermissions = p.availablePermissions;
	public readonly defaultPermissions = p.defaultPermissions;
	public readonly protect = p.protect;

	async setPermissions(c: ContextWithEnvironment) {
		// TODO: Set permissions
	}

	private extractPermissionsFromContext(
		c: ContextWithEnvironment,
		data: {
		}
	) {
		try {
			const session_data = c.get('session_data');
			if (!session_data) return;
			const {  } = data;

			
		} catch (error) {
			console.log(error);
		}
	}
	
	get injectPermissions() {
		return createMiddleware(async (c, n) => {
			await this.setPermissions(c);
			return n();
		});
	}

	public requirePermissions(config: {
		requiredPermissions: p.ProtectParams['requiredPermissions'];
		context?: 'branch' | 'company';
		raiseError?: p.ProtectParams['raiseError'];
		condition?: p.ProtectParams['condition'];
	}) {
		const { requiredPermissions, context, raiseError, condition } = config;
		const protect = p.protect;
		return createMiddleware(async (c, n) => {
			const currentUser = c.env.locals.user;
			if (currentUser?.super_admin) return n();

			// TODO: Get permissions
			const currentPermissions = c.get(
				`_permissions`
			);
			const canContinue = protect({
				permissions: currentPermissions,
				raiseError,
				requiredPermissions: requiredPermissions,
				condition,
			});

			if (canContinue) return n();

			return c.json(
				{
					success: false,
					data: null,
					message: 'You are not permitted to access this resource.',
				},
				403
			);
		});
	}
}

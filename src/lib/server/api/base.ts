import { Hono, type MiddlewareHandler } from 'hono';
import type { ContextWithEnvironment, Environment } from './types';
import { ServerlessInjectable } from 'elea-di';
import { PermissionService } from './services/permission-service';
import type { ProtectParams } from '$lib/permissions';
import { serverlessContainer } from '$hooks/container';
import { zValidator } from '@hono/zod-validator';
import { basePaginationQuery } from '$lib/common/validators/query';

export abstract class Controller extends ServerlessInjectable {
	permissionService: PermissionService =
		serverlessContainer.resolve(PermissionService);
	requirePermissions: (
		config: Omit<ProtectParams, 'permissions'> & {
			context?: 'branch' | 'company';
		}
	) => MiddlewareHandler<Environment>;
	protected readonly controller: Hono<Environment>;
	constructor() {
		super();

		this.controller = new Hono<Environment>();
		this.requirePermissions = this.permissionService.requirePermissions;
		this.requirePermissions = this.requirePermissions.bind(this);
		this.getPaginationQuery = this.getPaginationQuery.bind(this);
		this.paginationQueryValidator = this.paginationQueryValidator.bind(this);
	}
	abstract routes(): Hono<Environment>;

	/**
	 * Helper method that ensures that any errors are catched and we can have fine-grain
	 * control over to the function, right now, we are returning null
	 */
	protected async runQuery<T, A extends any[]>(config: {
		queryFn: (...args: A) => Promise<T>;
		args: A;
	}): Promise<T | null> {
		const { queryFn, args } = config;

		try {
			return await queryFn(...args);
		} catch (error) {
			console.log(error);
			return null;
		}
	}

	/**
	 * Helper method that returns the result of a query
	 */
	protected queryResult<T, E = T>(
		c: ContextWithEnvironment,
		data: { result: App.DefaultResponse<T, E> | null; name: string }
	) {
		const { result, name } = data;
		if (!result || !result.success || !result.data) {
			return c.json({
				success: false,
				message: `Failed to fetch ${name}`,
				data: [] as E,
			});
		}
		return c.json({
			success: true,
			message: `Successfully fetched ${name}`,
			data: result.data,
		});
	}

	protected getPaginationQuery(c: ContextWithEnvironment): Types.pagination | undefined{
		const { page = 1, limit = 20 } = c.req.query();
		if(page && limit){
			return {
				limit: +limit,
				offset: (+page - 1) * +limit
			}
		}
		return undefined
	}

	protected paginationQueryValidator(){
		return zValidator("query", basePaginationQuery)
	}
}

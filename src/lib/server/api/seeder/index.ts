import type { SeederService } from '$lib/database/seeder';
import { seedUsers } from '$lib/server/database/d1/users/seeder';
import { Controller } from '../base';

export class Seeder extends Controller {
	static __dependencies__ = ['SeederService'];

	constructor(private readonly seeder: SeederService) {
		super();
	}

	private createSeederHandler(
		entityName: string,
		seedFn: (
			db: any,
			amount: number,
			seeder?: SeederService
		) => Promise<any>
	) {
		return async (c: any) => {
			const amount = +c.req.param('amount');

			// Validate the amount
			if (!amount || amount <= 0) {
				return c.json({
					success: false,
					message:
						'Amount is required and must be a positive integer.',
					data: null,
				});
			}

			// Perform the seeding operation
			try {
				const result = await seedFn(
					c.env.locals.db,
					amount,
					this.seeder
				);
				return c.json({
					success: true,
					message: `Successfully seeded ${entityName}.`,
					data: structuredClone(result),
				});
			} catch (error) {
				return c.json({
					success: false,
					message: `Failed to seed ${entityName}.`,
					data: structuredClone(error),
				});
			}
		};
	}

	private async performBootstrap(
		c: any,
		operations: { entityName: string; fn: Function; amount: number }[]
	) {
		const results = [];
		for (const { entityName, fn, amount } of operations) {
			try {
				const result = await fn(c.env.locals.db, amount, this.seeder);
				results.push({
					entity: entityName,
					success: true,
					message: `Successfully seeded ${entityName}.`,
					data: structuredClone(result),
				});
			} catch (error) {
				results.push({
					success: false,
					message: `Failed to seed ${entityName}.`,
					data: {
						entity: entityName,
						error: structuredClone(error),
					},
				});
			}
		}
		return results;
	}

	routes() {
		// Explicitly add each route using the helper
		return this.controller
			.get('/users/:amount', this.createSeederHandler('users', seedUsers))
			.get('/bootstrap/:amount', async (c) => {
				const amount = +c.req.param('amount');

				// Validate the amount
				if (!amount || amount <= 0) {
					return c.json({
						success: false,
						message:
							'Amount is required and must be a positive integer.',
						data: null,
					});
				}

				// Define operations in the correct order
				const operations = [
					{ entityName: 'users', fn: seedUsers, amount },
				];

				// Perform all operations in sequence
				const results = await this.performBootstrap(c, operations);

				return c.json({
					success: true,
					message: 'Bootstrap operation completed.',
					data: {
						resultSummary: operations.map((item, index) => ({
							name: item.entityName,
							success: results[index].success,
						})),
						results,
					},
				});
			})
			.get('*', async (c) => {
				const baseUrl = new URL(c.req.url).origin;

				// Define the list of entities for dynamic documentation
				const entities = [
					'users',
				];

				// Construct dynamic links for each route
				const routes = entities.reduce((acc, entity) => {
					acc[
						entity
					] = `GET: ${baseUrl}/api/seeders/${entity}/:amount`;
					return acc;
				}, {} as Record<string, string>);

				// Include the bootstrap route explicitly
				routes[
					'bootstrap'
				] = `GET: ${baseUrl}/api/seeders/bootstrap/:amount`;

				return c.json({
					success: true,
					message:
						'Seeder information. SEEDER SHOULD ONLY BE USED FOR DEVELOPMENT.',
					data: routes,
				});
			});
	}
}

import { Hono } from 'hono';
import { Auth } from './auth';
import { Permissions } from './permissions';
import type { Environment } from './types';
import { LoginGuard } from './middlewares/login.guard';
import { Health } from './health';
import { PermissionService } from './services/permission-service';
import { getInstance, getRoutes } from './utils';
import { Assets } from './assets';
import { Seeder } from './seeder';
import { Tables } from './tables';
import { Features } from './features';

/* -------------------------------------------------------------------------- */
/*                                     App                                    */
/* -------------------------------------------------------------------------- */
export const app = new Hono<Environment>().basePath('/api');

/* -------------------------------------------------------------------------- */
/*                             Global Middlewares                             */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */
const routes = app
	.route('/health', getRoutes(Health))
	.route('/auth', getRoutes(Auth))
	.route('/features', getRoutes(Features))
	.route('/assets', getRoutes(Assets))

	// Routes that requires authentication
	.use(getInstance(LoginGuard).allowLoggedInUsers)
	.use(getInstance(PermissionService).injectPermissions)
	.route('/permissions', getRoutes(Permissions))

	// Routes that requires super admin authentication
	.use(getInstance(LoginGuard).allowSuperAdmin)
	.route('/seeders', getRoutes(Seeder))
	.route('/tables', getRoutes(Tables));

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export type AppRoutes = typeof app;
export type Routes = typeof routes;

export { routes };
export default app;

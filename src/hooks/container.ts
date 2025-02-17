import { createServerlessContainer } from 'elea-di';
import { runtimeKeys } from './runtimeKeys';
import { Auth } from '$lib/server/api/auth';
import { PermissionService } from '$lib/server/api/services/permission-service';
import { Permissions } from '$lib/server/api/permissions';
import { LoginGuard } from '$lib/server/api/middlewares/login.guard';
import { Health } from '$lib/server/api/health';
import { Assets } from '$lib/server/api/assets';
import { SeederService } from '$lib/database/seeder';
import { Seeder } from '$lib/server/api/seeder';
import { Tables } from '$lib/server/api/tables';
import { Features } from '$lib/server/api/features';

const container = createServerlessContainer();
container.registerRuntimeValue({}, runtimeKeys.db);
container.registerRuntimeValue({}, runtimeKeys.r2);

export const serverlessContainer = container
	// Controllers
	.registerClass(Health)
	.registerClass(Features)
	.registerClass(Auth)
	.registerClass(Permissions)
	.registerClass(Assets)
	.registerClass(Seeder)
	.registerClass(Tables)

	// Services
	.registerClass(PermissionService)
	.registerClass(SeederService)

	// Middlewares
	.registerClass(LoginGuard);

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		console.log('disposing container');
		container.cleanup();
	});
}

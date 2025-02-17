import { SEEDER_SERVICE } from "$lib/database/seeder";
import { users } from "./table";

export async function seedUsers(
	db: Types.db,
	amount = 10,
	seeder: Services.Seeder = SEEDER_SERVICE
) {
	// Fetch existing user IDs
	const existingUserIds = await db.query.users
		.findMany({
			columns: {
				id: true,
			},
		})
		.catch(() => []);
	const existingUserIdsArray = seeder.mapId(existingUserIds);

	const generateNewUser = () => {
		const shouldBeSame = seeder.boolean(0.8);
		let created_by: string | null = null;
		let updated_by: string | null = null;

		if (shouldBeSame) {
			const userId = seeder.chooseFromArray(existingUserIdsArray);

			created_by = userId;
			updated_by = userId;
		} else {
			created_by = seeder.chooseFromArray(existingUserIdsArray);
			updated_by = seeder.chooseFromArray(existingUserIdsArray);
		}

		const first_name = seeder.firstName();
		const last_name = seeder.lastName();
		const email = seeder
			.email({
				firstName: first_name,
				lastName: last_name,
			})
			.toLowerCase();
		return {
			email,
			first_name,
			last_name,
			hashed_password: seeder.hashedPassword(email),
			avatar: seeder.avatar(),
			super_admin: seeder.boolean(0.001),
			tester: seeder.boolean(0.2),
			created_by,
			updated_by,
		};
	};

	// Generate and insert users
	return await seeder.seed(
		db,
		users,
		Array.from({ length: amount }, generateNewUser)
	);
}

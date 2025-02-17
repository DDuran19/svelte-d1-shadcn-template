import { getFeatures } from "$lib/server/database/d1/features/queries";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	const features = await getFeatures(locals.db);

	if (!features || !features.success || !features.data)
		return {
			features: [],
			announcements: [],
			user: locals.user,
			session_data: locals.session_data || {},
		};

	return {
		features: features.data,
		announcements: [],
		user: locals.user,
		session_data: locals.session_data || {},
	};
};

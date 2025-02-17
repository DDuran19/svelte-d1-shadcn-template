import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
	const isLoggedIn = false;

	if (isLoggedIn) {
		redirect(303, "/apps");
	}
	return {};
};

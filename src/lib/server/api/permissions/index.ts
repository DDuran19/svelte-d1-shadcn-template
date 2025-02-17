import { Controller } from "../base";
import type { PermissionService } from "../services/permission-service";

export class Permissions extends Controller {
	routes() {
		return this.controller.get("/", async (c) => {
			return c.json({
				success: true,
				message: "Successfully retrieved permissions",
				data: {
					session_data: c.get("session_data"),
				},
			});
		});
	}
}

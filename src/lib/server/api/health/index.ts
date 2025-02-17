import { Controller } from "../base";

export class Health extends Controller {
	routes() {
		return this.controller.get("/", async (c) => {
			const requestInfo = {
				method: c.req.method,
				url: c.req.url,
				headers: c.req.header(),
				body: await c.req.parseBody(),
				queryParams: c.req.query(),
			};
			return c.json({
				success: true,
				message: "API is healthy",
				data: requestInfo,
			});
		});
	}
}

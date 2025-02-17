import { getFeatures } from "$lib/server/database/d1/features/queries";
import { Controller } from "../base";

export class Features extends Controller {
	routes() {
		return this.controller.get("/", async (c) => {
			const result = await this.runQuery({
				queryFn: getFeatures,
				args: [c.env.locals.db],
			});
			return this.queryResult(c, { result, name: "features" });
		});
	}
}

import { Controller } from "../base";
import { defaultImage } from "./defaultImage";

export class Assets extends Controller {
	constructor() {
		super();
	}

	routes() {
		return this.controller.get("*", async (c) => {
			const url = new URL(c.req.url);
			const pathname = url.pathname.slice(1);

			const image = await c.env.locals.r2?.get(pathname || "");
			if (image) {
				c.res.headers.set("Content-Type", "image/webp");
				return c.newResponse(await image.arrayBuffer());
			}
			c.res.headers.set("Content-Type", "image/svg+xml");
			const cleanedDefaultImage = defaultImage
				.trim()
				.replace(/[^A-Za-z0-9+/=]/g, "");
			const svgBuffer = new Uint8Array(
				atob(cleanedDefaultImage)
					.split("")
					.map((char) => char.charCodeAt(0))
			).buffer;
			return c.newResponse(svgBuffer);
		});
	}
}

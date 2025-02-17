import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "src/lib/server/database/d1/tables.ts",
	out: "./src/lib/server/database/d1/migrations",
	dbCredentials: {
		url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/3d9b76d16837321066c212ff090c15907cc6afdaf4c187ae7718a9d4cedb2800.sqlite",
	},
});

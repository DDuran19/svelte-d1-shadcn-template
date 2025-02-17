import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "src/lib/server/database/d1/tables.ts",
	out: "./src/lib/server/database/d1/migrations",
	dbCredentials: {
		url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/9a90bd176f5340995d53803ea8c96f045dfbcc40951748bc4f97aaa42ef24888.sqlite",
	},
});

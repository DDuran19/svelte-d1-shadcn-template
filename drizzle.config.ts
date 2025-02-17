import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "src/lib/server/database/d1/tables.ts",
	out: "./src/lib/server/database/d1/migrations",
	dbCredentials: {
		url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/6532d86fcdae12d38f70e5a04d1ca7e8e24716549fdea6aa62cbe7ba23e885a5.sqlite",
	},
});

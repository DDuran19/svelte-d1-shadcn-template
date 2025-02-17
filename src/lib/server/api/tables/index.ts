import { Controller } from "../base";

export class Tables extends Controller {
	routes() {
		return this.controller
			.get("/:tableName", async (c) => {
				const tableName = c.req.param("tableName");
				const columnsString = c.req.query("columns");
				const parsedColumns = columnsString?.split(",") || [];
				// Convert array of column names to a single object with keys set to true
				const columns = parsedColumns.reduce(
					(acc: Record<string, boolean>, col) => {
						acc[col] = true;
						return acc;
					},
					{}
				);

				const exists = tableName in c.env.locals.db.query;

				if (!exists) {
					return c.json({
						success: false,
						message: `Table ${tableName} does not exist`,
						data: null,
					});
				}

				try {
					const result = await c.env.locals.db.query[
						tableName as keyof typeof c.env.locals.db.query
					]
						.findMany({
							columns: parsedColumns.length ? columns : undefined,
						})
						.catch((err: unknown) => {
							return structuredClone(err);
						});

					return c.json({
						success: true,
						message: `Successfully fetched ${tableName}`,
						data: result,
					});
				} catch (error) {
					return c.json({
						success: false,
						message: `Failed to fetch ${tableName}`,
						data: structuredClone(error),
					});
				}
			})
			.get("*", async (c) => {
				const baseUrl = new URL(c.req.url);
				return c.json({
					success: true,
					message: "Available tables",
					data: Object.keys(c.env.locals.db.query).map(
						(key) => `GET: ${baseUrl.host}/api/tables/${key}`
					),
				});
			});
	}
}

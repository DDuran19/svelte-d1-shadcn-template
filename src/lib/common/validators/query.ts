import z from "zod";

export const basePaginationQuery = z
	.object({
		page: z.number().optional(),
		limit: z.number().optional(),
	})
	.optional();
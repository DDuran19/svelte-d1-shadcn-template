import { relations } from "drizzle-orm";
import { systemMetaDataRelations, users } from "../helpers";
import { sessions } from "./table";

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.user_id],
		references: [users.id],
	}),
	...systemMetaDataRelations(one, sessions),
}));

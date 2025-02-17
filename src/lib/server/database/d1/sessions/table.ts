import { sqliteTable } from "drizzle-orm/sqlite-core/table";
import {
	booleanColumn,
	idSystemMetadata,
	jsonColumn,
	dateColumn,
	userColumn,
	getUtcDateAfter,
	textColumn,
} from "../helpers";

export const sessions = sqliteTable("sessions", {
	...idSystemMetadata("sess_"),
	user_id: userColumn(),
	user_name: textColumn(),
	session_data: jsonColumn<Types.Session_data>({ defaultValue: {} }),
	request_info: jsonColumn({ defaultValue: {} }),
	expires_at: dateColumn({
		defaultValue: () => getUtcDateAfter(12, "hour"),
	}),
	active: booleanColumn({ defaultValue: true }),
	last_active_at: dateColumn(),
	last_updated_at: dateColumn(),
});

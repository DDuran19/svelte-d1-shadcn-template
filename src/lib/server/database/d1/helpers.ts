import { relations, SQL, sql } from 'drizzle-orm';
import {
	integer,
	sqliteTable,
	text,
	type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';
import { dateColumn, id, users, dayjs, getUtcDate, booleanColumn, textColumn } from './users/table';

export {
	id,
	booleanColumn,
	textColumn,
	jsonColumn,
	enumColumn,
	dateColumn,
	users,
	dayjs,
	getUtcDate,
} from './users/table';
/**
 * Converts a Unix timestamp (in seconds) to a UTC Date object.
 * @param {number} timestampInSeconds - The Unix timestamp in seconds.
 * @returns {Date} The UTC Date object.
 */
export function getUtcDateFromTimestamp(timestampInSeconds: number): Date {
	return dayjs.utc(timestampInSeconds * 1000).toDate(); // Multiply by 1000 to convert seconds to milliseconds
}

type GetUtcStartDateOptions = {
	unit?: dayjs.OpUnitType;
	date?: Date | string;
};
export function getUtcStartDate(options?: GetUtcStartDateOptions): Date {
	const { unit = 'day', date = getUtcDate() } = options || {};
	return dayjs.utc(date).startOf(unit).toDate();
}

export function getUtcDateAfter(
	amount: number,
	unit: dayjs.ManipulateType
): Date {
	return dayjs.utc().add(amount, unit).toDate();
}

export function elapsedTimeReached(
	date: Date,
	amount: number,
	unit: dayjs.ManipulateType
): boolean {
	const lastUpdatedAt = dayjs.utc(date);
	const now = dayjs.utc();
	const elapsed_time = now.diff(lastUpdatedAt);

	const required_time = dayjs.duration(amount, unit).asMilliseconds();

	return elapsed_time >= required_time;
}

export const unixepoch = sql`(unixepoch())`;

export function nullableDateColumn(config?: { name?: string }) {
	if (config?.name) {
		return integer(config.name, { mode: 'timestamp' });
	}

	return integer({ mode: 'timestamp' });
}

export const noAction = {
	onDelete: 'no action',
	onUpdate: 'no action',
} as const;

export function userColumn(config?: { name: string }) {
	if (!config) {
		return text()
			.notNull()
			.references(() => users.id, noAction);
	}
	const { name } = config;

	if (name) {
		return text(name)
			.notNull()
			.references(() => users.id, noAction);
	}

	return text()
		.notNull()
		.references(() => users.id, noAction);
}

export const withId = (name: string) =>
	sqliteTable(name, {
		...id(name),
	});

type TableWithId = ReturnType<typeof withId>;
export function tableReference<T extends TableWithId | (() => TableWithId)>(
	table: T
) {
	if (typeof table === 'function') {
		return text()
			.notNull()
			.references((): AnySQLiteColumn => table().id, noAction);
	}
	return text()
		.notNull()
		.references((): AnySQLiteColumn => table.id, noAction);
}

export function nullableTableReference<
	T extends TableWithId | (() => TableWithId)
>(table: T) {
	if (typeof table === 'function') {
		return text().references((): AnySQLiteColumn => table().id, noAction);
	}
	return text().references((): AnySQLiteColumn => table.id, noAction);
}

export const archivable = () => ({
	archived: booleanColumn({
		defaultValue: false,
	}),
	archived_by_user_id: nullableTableReference(users),
	archived_by_name: textColumn(),
	archived_at: nullableDateColumn(),
});

export function archiveDetails(data: {
	archived_by_user_id: string;
	archived_by_name: string;
}) {
	const today = getUtcDate();
	return {
		status: false,
		archived: true,
		archived_by_user_id: data.archived_by_user_id,
		archived_by_name: data.archived_by_name,
		archived_at: today,
		updated_by_id: data.archived_by_user_id,
		updated_at: today,
	};
}
export const timestamps = {
	created_at: dateColumn(),
	updated_at: dateColumn(),
};

export const systemMetaData = {
	...timestamps,
	created_by_id: text()
		.notNull()
		.references(() => users.id, noAction),
	updated_by_id: text()
		.notNull()
		.references(() => users.id, noAction),
};

export const idSystemMetadata = (idPrefix: string) => {
	return {
		...id(idPrefix),
		...systemMetaData,
	};
};

export const withSystemMetadata = (name: string) =>
	sqliteTable(name, {
		...systemMetaData,
	});

type TableWithSystemMetadata = ReturnType<typeof withSystemMetadata>;

export const systemMetaDataRelations = <T extends TableWithSystemMetadata>(
	one: Parameters<Parameters<typeof relations>[1]>[0]['one'],
	table: T
) => {
	return {
		created_by: one(users, {
			fields: [table.created_by_id],
			references: [users.id],
		}),
		updated_by: one(users, {
			fields: [table.updated_by_id],
			references: [users.id],
		}),
	};
};

export const defaultUserReferencedColumns = {
	id: true,
	first_name: true,
	last_name: true,
	email: true,
} as const;

export type DefaultUserReferencedColumns = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
};

export const systemMetaDataQuery = {
	created_by: {
		columns: defaultUserReferencedColumns,
	},
	updated_by: {
		columns: defaultUserReferencedColumns,
	},
} as const;

export type SystemMetaDataQuery = {
	created_by: DefaultUserReferencedColumns;
	updated_by: DefaultUserReferencedColumns;
};

export type userFullName = string;

export function errorOnDbConnection<T extends any = null, E extends any = T>(
	returnValue: E = null as E
): App.DefaultResponse<T, E> {
	if (Array.isArray(returnValue)) {
		return {
			success: false as const,
			message: 'Error connecting to database',
			data: returnValue as E,
			page_info: { total: 0, page: 0, size: 0 },
		};
	}

	return {
		success: false as const,
		message: 'Error connecting to database',
		data: returnValue as E,
	};
}

export function flattenMetadata<
	T extends SystemMetaDataQuery | { created_by?: any; updated_by?: any }
>(source: T): Helpers.ReplaceCreatedByUpdatedByAndOwner<T> {
	// Recursively scan the object for `created_by` or `updated_by`
	for (const key in source) {
		if (key !== 'created_by' || key !== 'updated_by') continue;

		if (typeof source[key] === 'object' && source[key] !== null) {
			const value = source[key];

			// If it's an array, recursively flatten each item
			if (Array.isArray(value)) {
				(source[key] as any) = value.map((item) =>
					typeof item === 'object' && item !== null
						? flattenMetadata(item)
						: item
				);
			} else {
				// Recursively flatten nested objects
				(source[key] as any) = flattenMetadata(value);
			}
		}
	}

	// Only modify the object if it contains the keys `created_by` or `updated_by`
	// @ts-expect-error
	return {
		...source,
		created_by:
			'created_by' in source && typeof source.created_by !== 'string'
				? `${source.created_by?.first_name} ${source.created_by?.last_name}`
				: source.created_by,
		updated_by:
			'updated_by' in source && typeof source.updated_by !== 'string'
				? `${source.updated_by?.first_name} ${source.updated_by?.last_name}`
				: source.updated_by,
	};
}

export function flattenMetadataAndExtractOwnerId<
	T extends SystemMetaDataQuery | { created_by?: any; updated_by?: any }
>(source: T): Helpers.ReplaceCreatedByUpdatedByAndOwner<T> {
	// Recursively scan the object for `created_by` or `updated_by` AND if there's an "owner" key with "id" inside
	for (const key in source) {
		if (key !== 'created_by' || key !== 'updated_by' || key !== 'owner')
			continue;

		if (
			key === 'owner' &&
			typeof source[key] === 'object' &&
			source[key] &&
			'id' in source[key] &&
			typeof source[key].id === 'string'
		) {
			// @ts-expect-error directly replace the object with the id
			source[key] = source[key].id;

			continue;
		}

		if (typeof source[key] === 'object' && source[key] !== null) {
			const value = source[key];

			// If it's an array, recursively flatten each item
			if (Array.isArray(value)) {
				(source[key] as any) = value.map((item) =>
					typeof item === 'object' && item !== null
						? flattenMetadata(item)
						: item
				);
			} else {
				// Recursively flatten nested objects
				(source[key] as any) = flattenMetadata(value);
			}
		}
	}

	// Only modify the object if it contains the keys `created_by` or `updated_by`
	// @ts-expect-error
	return {
		...source,
		created_by:
			'created_by' in source && typeof source.created_by !== 'string'
				? `${source.created_by.first_name} ${source.created_by.last_name}`
				: source.created_by,
		updated_by:
			'updated_by' in source && typeof source.updated_by !== 'string'
				? `${source.updated_by.first_name} ${source.updated_by.last_name}`
				: source.updated_by,
	};
}

export function simpleFlattenMetadata<T extends SystemMetaDataQuery>(
	source: T
): {
	created_by: string;
	updated_by: string;
} {
	return {
		created_by:
			'created_by' in source && typeof source.created_by !== 'string'
				? `${source.created_by.first_name} ${source.created_by.last_name}`
				: (source.created_by as unknown as string),
		updated_by:
			'updated_by' in source && typeof source.updated_by !== 'string'
				? `${source.updated_by.first_name} ${source.updated_by.last_name}`
				: (source.updated_by as unknown as string),
	};
}

export function withPaginationQuery(data?: Types.pagination) {
	if (!data) return;
	return {
		limit: data.limit,
		offset: data.offset,
		extras: {
			count: sql<number | undefined>`COUNT(*) OVER ()`.as('count')
		},
	};
}

export function paginate<T>(array: Array<T>, pagination?: Types.pagination) {
	if (!pagination)
		return {
			data: array,
			page_info: { total: array.length, page: 1, size: array.length },
		};
	return {
		data: array.slice(
			pagination.offset,
			pagination.offset + pagination.limit
		),
		page_info: {
			total: array.length,
			page: pagination.offset / pagination.limit + 1,
			size: pagination.limit,
		},
	};
}

export function addPaginationDetails<T>(
	array: Array<T>,
	pagination?: Types.pagination
) {
	const total: number = Array.isArray(array) && !!array[0] && typeof array[0] === 'object' && 'count' in array[0] && typeof array[0].count === 'number'
		? array[0].count
		: array.length;
	if (!pagination)
		return {
			data: array,
			page_info: { total, page: 1, size: array.length },
		};
	return {
		data: array,
		page_info: {
			total,
			page: pagination.offset / pagination.limit + 1,
			size: pagination.limit,
		},
	};
}

export function deleteHashedPassword<T extends { hashed_password?: string }>(
	user: T
): Omit<T, 'hashed_password'> {
	if (user.hashed_password) {
		delete user.hashed_password;
	}

	return user;
}

/**
 * Sanitizes input for different contexts (SQL, JSON, HTML, etc.)
 * @param {string | number | null | undefined} input - The input to sanitize.
 * @returns {string | null} - Sanitized string or null if input is invalid.
 */
export function sanitizeInput(
	input: string | number | null | undefined
): string | null {
	if (input === null || input === undefined) return null;

	if (typeof input === 'number') return input.toString();

	// Replace potentially harmful characters with safe equivalents
	return input.replace(/[\0\x08\x09\x1a\n\r"'\\<>&%]/g, (char) => {
		switch (char) {
			case '\0':
				return '\\0'; // Null byte
			case '\x08':
				return '\\b'; // Backspace
			case '\x09':
				return '\\t'; // Tab
			case '\x1a':
				return '\\z'; // Substitute
			case '\n':
				return '\\n'; // Newline
			case '\r':
				return '\\r'; // Carriage return
			case "'":
				return "\\'"; // Single quote
			case '"':
				return '\\"'; // Double quote
			case '\\':
				return '\\\\'; // Backslash
			case '<':
				return '&lt;'; // Less than (HTML/XSS)
			case '>':
				return '&gt;'; // Greater than (HTML/XSS)
			case '&':
				return '&amp;'; // Ampersand (HTML/XSS)
			case '%':
				return '\\%'; // Percent (SQL LIKE queries)
			default:
				return char;
		}
	});
}

export function SQLCase<TRuleReturn>(
	...rules: SQL<TRuleReturn>[]
): SQL<TRuleReturn> {
	const s = sql<TRuleReturn>`CASE`;
	rules.forEach((rule) => {
		s.append(rule);
	});
	s.append(sql`END`);
	return s;
}

export function SQLWhen<T>(condition: SQL<unknown>, value: T): SQL<T> {
	return sql<T>`WHEN ${condition} THEN ${value}`;
}

export function SQLElse<T>(value: T): SQL<T> {
	return sql<T>`ELSE ${value}`;
}

import {
    text,
    sqliteTable,
    integer,
    type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const id = (prefix: string) => {
    return {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => `${prefix}${nanoid(21)}`),
    };
};

export function textColumn(config?: { name?: string; defaultValue?: string }) {
    if (!config) {
        return text()
            .notNull()
            .$defaultFn(() => "");
    }
    const { name, defaultValue } = config;
    return text(name)
        .notNull()
        .$defaultFn(() => defaultValue || "");
}

export function jsonColumn<T>(config: { name?: string; defaultValue: T }) {
    const { name, defaultValue } = config;
    if (name) {
        return text(name, { mode: "json" })
            .notNull()
            .$type<T>()
            .$defaultFn(() => defaultValue);
    }

    return text({ mode: "json" })
        .notNull()
        .$type<T>()
        .$defaultFn(() => defaultValue);
}

export function booleanColumn(config?: {
    name?: string;
    defaultValue?: boolean;
}) {
    if (!config) {
        return integer({ mode: "boolean" })
            .notNull()
            .$defaultFn(() => false);
    }
    const { name, defaultValue } = config;

    if (name && typeof defaultValue === "boolean") {
        return integer(name, { mode: "boolean" })
            .notNull()
            .default(defaultValue);
    } else if (!name && typeof defaultValue === "boolean") {
        return integer({ mode: "boolean" })
            .notNull()
            .$defaultFn(() => defaultValue);
    } else if (name) {
        return integer(name, { mode: "boolean" })
            .notNull()
            .$defaultFn(() => false);
    }
    return integer({ mode: "boolean" })
        .notNull()
        .$defaultFn(() => false);
}

export function enumColumn<T extends string>(config?: {
    name?: string;
    defaultValue: T;
}) {
    if (!config) {
        return text().notNull().$type<T>();
    }
    return text(config.name)
        .notNull()
        .$type<T>()
        .$defaultFn(() => config.defaultValue);
}

export function numberColumn(config?: { name?: string; defaultValue: number }) {
    if (!config) {
        return integer()
            .notNull()
            .$defaultFn(() => 0);
    }

    if (config.name) {
        return integer(config.name)
            .notNull()
            .$defaultFn(() => config.defaultValue);
    }

    return integer()
        .notNull()
        .$defaultFn(() => config.defaultValue);
}

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";
dayjs.extend(utc);
dayjs.extend(duration);
export { dayjs };
export function dateColumn(config?: {
    name?: string;
    defaultValue?: Date | (() => Date);
}) {
    const { name, defaultValue } = config || {};

    // Determine the base integer column setup with or without a name
    const column = name
        ? integer(name, { mode: "timestamp" })
        : integer({ mode: "timestamp" });

    // Handle the default value based on its type
    if (defaultValue instanceof Date) {
        return column.notNull().$defaultFn(() => defaultValue);
    } else if (typeof defaultValue === "function") {
        return column.notNull().$defaultFn(defaultValue);
    }

    // Fallback to using getUtcDate if no defaultValue is provided
    return column.notNull().$defaultFn(getUtcDate);
}

export function getUtcDate(unit?: dayjs.OpUnitType): Date {
    if (unit) {
        return dayjs.utc().startOf(unit).toDate();
    }
    return dayjs.utc().toDate();
}

export const users = sqliteTable("users", {
    ...id("user_"),
    avatar: textColumn(),
    first_name: textColumn(),
    last_name: textColumn(),
    email: textColumn(),
    hashed_password: textColumn(),
    tester: booleanColumn(),
    super_admin: booleanColumn(),

    created_at: dateColumn(),
    updated_at: dateColumn(),

    created_by_id: text().references((): AnySQLiteColumn => users.id, {
        onDelete: "no action",
        onUpdate: "no action",
    }),
    updated_by_id: text().references((): AnySQLiteColumn => users.id, {
        onDelete: "no action",
        onUpdate: "no action",
    }),
});

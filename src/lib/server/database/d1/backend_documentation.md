Below is a high-level guide and reference documenting **how to create tables in Drizzle** and **how to use the specific patterns** (such as `withId`, `tableReference`, `archivable`, `systemMetaData`, etc.) from the codebase you provided. This documentation aims to help you understand the rationale behind each helper, how to define columns and references, and how these pieces fit together when building a schema with Drizzle (particularly Drizzle for SQLite).

---

## Table of Contents

1. **Introduction**
2. **Core Concepts & Utilities**
   - 2.1. `withId()`
   - 2.2. `tableReference()` and `nullableTableReference()`
   - 2.3. `archivable()` and `archiveDetails()`
   - 2.4. `timestamps` and `systemMetaData`
   - 2.5. `idSystemMetadata()` and `withSystemMetadata()`
   - 2.6. `systemMetaDataRelations()`
3. **Common Column Helpers**
   - 3.1. `textColumn()`
   - 3.2. `booleanColumn()`
   - 3.3. `enumColumn()`
   - 3.4. `dateColumn()` and `nullableDateColumn()`
   - 3.5. `jsonColumn()`
   - 3.6. `userColumn()`
4. **Example: Defining a New Table**
5. **Relationships & the `relations()` API**
6. **Reference Patterns in Action**
7. **Pagination & Query Helpers**
8. **Archiving & Metadata Updates**
9. **Putting It All Together**
10. **Additional Tips & Best Practices**

---

## 1. Introduction

The provided codebase is built around **Drizzle ORM** for SQLite, using a pattern-based approach to define columns and relationships in a reusable way. The main goals of these patterns are:

- **Consistency**: Standardize how IDs, timestamps, metadata, and references are handled.
- **Reusability**: Reduce boilerplate by extracting common definitions (e.g., an `archivable` mixin for “archived” columns).
- **Type Safety**: Ensure TypeScript-friendly column definitions and references.

If you are new to Drizzle, it’s helpful to know that **Drizzle** has:

- **`sqliteTable()`** (or simply `pgTable()` / `mysqlTable()` in other dialects) for creating a schema definition.
- **Column builders** (`text`, `integer`, `boolean`, etc.) that define the column’s type.
- **Relations** (through the `relations()` function) for describing how tables reference each other, so that Drizzle can generate typed queries and joins.

---

## 2. Core Concepts & Utilities

Below are the key helper utilities you will see repeatedly in the code.

### 2.1. `withId()`
```ts
export const withId = (name: string) =>
  sqliteTable(name, {
    ...id(name),
  });
```

- **Purpose**: Creates a table with a single `id` column that uses a prefix (e.g. `"comp_"` for companies, `"user_"` for users).
- **Usage**: 
  ```ts
  // This returns a "table builder" with just an `id` field
  const myTable = withId("my_table");
  ```
- **Underlying Implementation**:  
  The `id(name)` call comes from:
  ```ts
  export const id = (prefix: string) => {
    return {
      id: text("id")
        .primaryKey()
        .$defaultFn(() => `${prefix}${nanoid(21)}`),
    };
  };
  ```
  This means each row’s ID is automatically generated (with a `nanoid`), and prefixed (e.g. `comp_`) to make table records more easily distinguishable across the system.

### 2.2. `tableReference()` and `nullableTableReference()`
- **Purpose**: A clean way to define foreign keys that reference the ID of another table, optionally allowing `NULL`.
- **Usage**:  
  ```ts
  // Non-nullable:
  tableReference(companies)

  // Nullable:
  nullableTableReference(company_roles)
  ```
- **Behavior**:
  - If you pass a table directly:  
    ```ts
    tableReference(companies)
    ```
    it references `companies.id`.
  - If you pass a function, it references the ID of the returned table:
    ```ts
    tableReference(() => companies)
    ```
- **Implementation** (simplified):
  ```ts
  export function tableReference<T extends TableWithId | (() => TableWithId)>(table: T) {
    // returns `text().notNull().references(() => table.id, noAction)`
  }

  export function nullableTableReference<T extends TableWithId | (() => TableWithId)>(table: T) {
    // returns `text().references(() => table.id, noAction)`
  }
  ```
  This ensures Drizzle applies a `REFERENCES ... (ON DELETE NO ACTION ON UPDATE NO ACTION)` constraint under the hood.

### 2.3. `archivable()` and `archiveDetails()`
- **Purpose**:  
  - `archivable()` adds columns (`archived`, `archived_by_user_id`, `archived_by_name`, `archived_at`) to a table.  
  - `archiveDetails()` returns the updated row data (e.g. setting `archived = true`, updating timestamps, etc.) for an “archive” operation.
- **Usage**:
  ```ts
  // Use in table definitions
  export const categories = sqliteTable("categories", {
    ...archivable(),
    // ...other columns
  });

  // Use in a query to "archive" a row
  db.update(categories)
    .set({ ...archiveDetails({ archived_by_user_id, archived_by_name }) })
    .where(eq(categories.id, category_id));
  ```
- **Benefits**: Standardizes columns and logic for “soft-deleting” or “archiving” data without physically deleting it.

### 2.4. `timestamps` and `systemMetaData`
- `timestamps`:  
  ```ts
  export const timestamps = {
    created_at: dateColumn(),
    updated_at: dateColumn(),
  };
  ```
  This object provides two columns, `created_at` and `updated_at`, which default to a UTC timestamp (via `dayjs`).
- `systemMetaData`:  
  ```ts
  export const systemMetaData = {
    ...timestamps,
    created_by_id: text().notNull().references(() => users.id, noAction),
    updated_by_id: text().notNull().references(() => users.id, noAction),
  };
  ```
  This combines the timestamps with `created_by_id` and `updated_by_id` columns, referencing the `users` table.

### 2.5. `idSystemMetadata()` and `withSystemMetadata()`
- **`idSystemMetadata(prefix: string)`**: Combines the `id` generator plus the entire `systemMetaData` object.
  ```ts
  export const idSystemMetadata = (idPrefix: string) => {
    return {
      ...id(idPrefix),
      ...systemMetaData,
    };
  };
  ```
  Example usage in a table:
  ```ts
  export const announcements = sqliteTable("announcements", {
    ...idSystemMetadata("annc_"),
    // ...other columns...
  });
  ```
- **`withSystemMetadata(name: string)`**: Creates a table with *only* the `systemMetaData` columns (no `id`).
  ```ts
  export const withSystemMetadata = (name: string) =>
    sqliteTable(name, {
      ...systemMetaData,
    });
  ```

### 2.6. `systemMetaDataRelations()`
When defining relations via Drizzle’s `relations(...)` API, you often want to specify how `created_by_id` and `updated_by_id` relate back to the `users` table. `systemMetaDataRelations()` automates this:

```ts
export const systemMetaDataRelations = <T extends TableWithSystemMetadata>(
  one: Parameters<Parameters<typeof relations>[1]>[0]["one"],
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
```

Essentially, you call:
```ts
relations(announcements, ({ one }) => ({
  ...systemMetaDataRelations(one, announcements),
  // additional relations here
}));
```
This automatically sets up `created_by` and `updated_by` references to the `users` table.

---

## 3. Common Column Helpers

In `helpers.ts` and `users/table.ts`, there are a variety of column-creation helpers. These make the code more consistent and type-safe.

### 3.1. `textColumn()`
Creates a non-null `TEXT` column with an optional default function. Essentially sugar around `text().notNull()` plus any default string logic.

### 3.2. `booleanColumn()`
Creates a Drizzle `integer({ mode: 'boolean' })` column that is typed as a boolean in TypeScript. Can be set to default `true` or `false`.  
Example usage:
```ts
archived: booleanColumn({ defaultValue: false }),
```

### 3.3. `enumColumn()`
Wraps Drizzle’s standard `text().$type<T>()` approach for enumerations. Allows for:
```ts
enumColumn<AnnouncementType>({ defaultValue: 'system' })
```
which sets the default to `'system'`.

### 3.4. `dateColumn()` and `nullableDateColumn()`
- `dateColumn()` wraps `integer({ mode: 'timestamp' })` and sets a default function (by default `dayjs.utc().toDate()`) to store timestamps as integers.
- `nullableDateColumn()` is the same but allows `null`.

### 3.5. `jsonColumn()`
Defines a JSON-typed column by using `text({ mode: 'json' }).$type<T>()` under the hood, so Drizzle can store JSON in text form, but type it strongly in TypeScript.

### 3.6. `userColumn()`
A specialized helper for referencing the `users.id` column. It automatically adds:
```ts
text(name).notNull().references(() => users.id, noAction)
```
If called with no `config`, it uses a default name.

---

## 4. Example: Defining a New Table

Suppose you want a table named `projects` that has:

- An auto-generated ID prefixed by `"proj_"`.
- Standard system metadata (`created_at`, `updated_at`, `created_by_id`, `updated_by_id`).
- A name, description, and archived columns (with the `archivable()` mixin).

Here’s how you might define it:

```ts
import { sqliteTable } from "drizzle-orm/sqlite-core";
import {
  idSystemMetadata,
  archivable,
  textColumn,
} from "../helpers";

export const projects = sqliteTable("projects", {
  ...idSystemMetadata("proj_"),          // => id, created_at, updated_at, created_by_id, updated_by_id
  ...archivable(),                       // => archived, archived_by_user_id, archived_by_name, archived_at
  name: textColumn(),
  description: textColumn(),
});
```

Then, in `relations.ts` (if needed):

```ts
import { relations } from "drizzle-orm";
import { users } from "../users/table";
import { projects } from "./table";
import { systemMetaDataRelations } from "../helpers";

export const projectsRelations = relations(projects, ({ one }) => ({
  // systemMetaDataRelations creates "created_by" and "updated_by" references
  ...systemMetaDataRelations(one, projects),
  // Optionally add other relations referencing users or other tables
}));
```

---

## 5. Relationships & the `relations()` API

In Drizzle, once your tables are defined, you can specify table relationships (one-to-many, many-to-many, etc.) by calling:

```ts
export const someTableRelations = relations(someTable, ({ one, many }) => ({
  // For one-to-many references:
  otherTable: many(otherTable),
  
  // For one-to-one references:
  user: one(users, {
    fields: [someTable.created_by_id],
    references: [users.id],
  }),

  // ... etc.
}));
```

The code base you provided often uses a pattern like:

```ts
export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  acknowledged: many(users),
  target_users: many(users),
  do_not_show: many(users),
  target_companies: many(companies),
  ...systemMetaDataRelations(one, announcements),
}));
```

Here, multiple foreign keys or pivot tables are used to define multi-user relationships or references. The spread `...systemMetaDataRelations(one, announcements)` is a convenience that automatically sets up relationships for `created_by` and `updated_by`.

---

## 6. Reference Patterns in Action

When you see columns such as:

```ts
company_id: tableReference(companies),
role_id: nullableTableReference(company_roles),
user_id: userColumn(),
```

it tells you:

- **`company_id`** references `companies.id` (and is non-null).
- **`role_id`** references `company_roles.id` but can be `NULL`.
- **`user_id`** references `users.id` with `NOT NULL`.

The code patterns let you quickly see how foreign keys are set up without manually writing `.references(() => otherTable.id)` each time.

---

## 7. Pagination & Query Helpers

Throughout the queries code, you’ll see utilities like:

- **`withPaginationQuery()`**  
  Builds a Drizzle query object with `limit` and `offset`.
- **`paginate()`**  
  Slices an in-memory array according to pagination info.
- **`addPaginationDetails()`**  
  Adds `page_info` to a response (e.g. `{ total, page, size }`).

The typical usage pattern is:
```ts
const result = await db.query.companies.findMany({
  ...withPaginationQuery(page),
  // other filters...
});
return {
  success: true,
  ...addPaginationDetails(result, page),
};
```
This ensures consistent pagination responses across endpoints.

---

## 8. Archiving & Metadata Updates

The code uses:

```ts
.archiveDetails({ archived_by_user_id, archived_by_name })
```
in update statements to toggle `archived`, set `archived_at`, and record which user performed the archive.

Additionally, `flattenMetadata()`, `flattenMetadataAndExtractOwnerId()`, and `simpleFlattenMetadata()` are used to transform raw query results so that nested user objects (`created_by`, `updated_by`) become simpler strings or IDs in the final returned data. This is purely for convenience in building API responses.

---

## 9. Putting It All Together

1. **Define the Table**:  
   Start with a name and decide if you want an `id` prefix. Include your columns using the various helpers (`textColumn`, `booleanColumn`, `enumColumn`, etc.). If you want timestamps and user references, add them with `idSystemMetadata(prefix)` or `systemMetaData`.
   
2. **Set Up References**:  
   If this table has a foreign key to another table, use `tableReference(otherTable)` or `nullableTableReference(otherTable)`.
   
3. **Add Archivable Logic (Optional)**:  
   If the table needs “soft-deletes,” include `...archivable()` in your column definitions.
   
4. **Create Relations**:  
   In `relations.ts` (or an equivalent file), import your table definitions and define `relations()` as needed. If you have `created_by_id` and `updated_by_id`, spread `...systemMetaDataRelations(one, myTable)` to wire them up to the `users` table.
   
5. **Write Queries**:  
   Use Drizzle’s `.findMany()`, `.findFirst()`, `.insert()`, `.update()`, etc. For advanced patterns, the codebase includes custom functions (`flattenMetadata`, pagination, archiving) to keep things consistent.

---

## 10. Additional Tips & Best Practices

1. **Keep Helpers Centralized**:  
   All your column-building helpers (`textColumn()`, `booleanColumn()`, etc.) should remain in one file (like `helpers.ts`). This keeps table definitions consistent and discoverable.
   
2. **Use Strong Typing in Enums**:  
   For columns representing an enum, define TypeScript `type`s or `enum`s in a central place, then use `enumColumn<MyEnum>()` to ensure type safety.
   
3. **Namespace or Prefix IDs**:  
   Using different prefixes (like `comp_`, `user_`, `annc_`) helps you quickly identify which table a record came from. The approach in this code is particularly useful in large multi-tenant or multi-entity systems.
   
4. **Leverage Relations**:  
   Drizzle’s `relations()` API is powerful. It automatically types nested objects when you use `.with {...}` in your `.findMany()` or `.findFirst()` calls.
   
5. **Soft Deletions vs. Hard Deletions**:  
   Decide if you need to physically remove data from the database or just mark them as “archived.” This codebase uses an “archivable” approach. Always consider how you want to handle eventually-deleted data.

---

# Summary

This documentation covers how to create tables with Drizzle in a pattern-driven, type-safe way. The key takeaways:

- **Use `id(prefix)`** to generate strongly-typed IDs with a prefix.
- **`systemMetaData`, `archivable`, and `timestamps`** are composable mixins that add common fields (like `created_at`, `archived`, etc.).
- **`tableReference()`** and **`nullableTableReference()`** standardize your foreign key references.
- **`relations()`** in Drizzle helps define typed relationships, often used in a separate `relations.ts`.
- **Helper functions** (like `archiveDetails`, `flattenMetadata`, `withPaginationQuery`) keep queries and data transformations consistent across your codebase.

By following these patterns, you maintain cleaner, more maintainable schemas and queries.
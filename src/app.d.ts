// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces


import * as schemas from '$lib/server/database/d1/tablesAndRelations';
import * as tables from '$lib/server/database/d1/tables';
import { flattenMetadata } from '$lib/server/database/d1/helpers';
import type { Icon } from 'lucide-svelte';
import type { SeederService } from '$lib/database/seeder';
import type { AppPermission } from './permissions';

declare global {
    namespace App {
        interface Locals {
            db: DrizzleD1Database<typeof schemas>;
            r2: R2Bucket;
            user: Types.user | undefined;
            skip: boolean;
            session_data: Types.Session_data | undefined;
        }
        interface Platform {
            env: Env
            cf: CfProperties
            ctx: ExecutionContext
        }
        type DefaultResponse<T, E = T> = BaseResponse<T, E> &
            WithPageInfoIfArray<T>;
        type Schemas = {
            [K in keyof typeof schemas]: (typeof schemas)[K]['$inferSelect'];
        };
        type InsertSchemas = {
            [K in keyof typeof schemas]: (typeof schemas)[K]['$inferInsert'];
        };
        type FlattenedSchemas = {
            [K in keyof typeof schemas]: Helpers.ReplaceCreatedByUpdatedByAndOwner<
                (typeof schemas)[K]['$inferSelect']
            >;
        };
    }

    namespace Types {
        type db = App.Locals['db'];
        type user_id = App.Schemas['users']['id'];
        type user = Omit<App.Schemas['users'], 'hashed_password'>;
        type feature = App.Schemas['features'];
        type features = Types.feature[];
        type clientSide<T> = Helpers.ReplaceCreatedAtUpdatedAtToString<T>;
        type pagination = {
            limit: number;
            offset: number;
        };
        type permission = AppPermission;
        type permissions = AppPermission[];
        type DayUnit =
            | 'months'
            | 'weeks'
            | 'days'
            | 'hours'
            | 'minutes'
            | 'seconds'
            | 'milliseconds';

        type sidebarItemData = {
            title: string;
            label?: string;
            icon?: typeof Icon;

            href?: string;
            hash?: string;
            searchParams?: Record<string, string>;

            subRoutes?: sidebarItemData[];
            requiredPermissions?: AppPermission[];
            roles?: string[];
            condition?: (...args: any[]) => boolean;

            dynamicKey?: string;
        };
        type defaultUserReferencedColumn = {
            id: string;
            first_name: string;
            last_name: string;
            email: string;
        };
        type Session_data = {
            super_admin?: boolean;
        };
    }

    namespace Helpers {
        type withCreatedAndUpdatedBy<T> = T & {
            created_by: Types.defaultUserReferencedColumn;
            updated_by: Types.defaultUserReferencedColumn;
        };
        type ReplaceCreatedByUpdatedByAndOwner<T> = {
            [K in keyof T]: K extends 'created_by' | 'updated_by' | 'owner'
            ? string // Transform these specific keys to string
            : T[K] extends Date
            ? Date // Keep Date type unchanged
            : T[K] extends (infer U)[]
            ? U extends object
            ? ReplaceCreatedByUpdatedByAndOwner<U>[] // Recursively apply to array elements
            : T[K] // Keep the array as is
            : T[K] extends Record<string, unknown>
            ? ReplaceCreatedByUpdatedByAndOwner<T[K]> // Recursively apply to nested objects
            : T[K]; // Keep the original type
        };

        type ReplaceCreatedAtUpdatedAtToString<T> = {
            [K in keyof T]: K extends 'created_at' | 'updated_at'
            ? string // Transform these specific keys to string
            : T[K] extends Date
            ? Date // Keep Date type unchanged
            : T[K] extends (infer U)[]
            ? U extends object
            ? ReplaceCreatedAtUpdatedAtToString<U>[] // Recursively apply to array elements
            : T[K] // Keep the array as is
            : T[K] extends object
            ? ReplaceCreatedAtUpdatedAtToString<T[K]> // Recursively apply to nested objects
            : T[K]; // Keep the original type
        };

        type Flatten<T> = T extends Array<infer U>
            ? Array<Flatten<U>>
            : T extends Date
            ? Date // Preserve Date type
            : T extends object
            ? { [K in keyof T]: Flatten<T[K]> }
            : T;

        type Constructor<T = any> = new (...args: any[]) => T;
        type IsArray<T> = [T] extends [any[]] ? true : false;
        type IsTrue<T> = [T] extends [true] ? true : false;

        type DatabaseAction =
            | 'create'
            | 'read'
            | 'update'
            | 'delete'
            | 'list'
            | 'archive';
        type Table = keyof typeof tables;
    } 
    namespace UITypes {
        type BreadCrumb = {
            label: string;
            href?: string;
            type?: 'link' | 'page';
            last: boolean;
            icon?: string;
            color?: string;
        };

        type SidebarItem = {
            title: string;
            href?: string;
            icon?: typeof Icon;
            condition?: (...args: any[]) => boolean;
            isActive?: boolean;
            requiredPermissions?: AppPermission[];
            items?: {
                title: string;
                href: string;
                requiredPermissions?: AppPermission[];
                condition?: (...args: any[]) => boolean;
            }[];
        };

        type SidebarItems = SidebarItem[];
        type SidebarData = {
            groupLabel: string;
            items: SidebarItems;
        };

        type DataTableActions<T> = {
            row: T;
            index: number;
            class: string;
        };
    }

    namespace UrlState {
        type UrlPathPartName = {
            base: 0;

            context: 1; // apps
            subContext: 2;
            detail: 3;
            subDetail: 4;
        };
        type Actions = `${Helpers.DatabaseAction}_${Helpers.Table}`;
    }

    namespace Services {
        type Seeder = SeederService;
    }
}
type BaseResponse<T, E = unknown> =
    | {
        success: true;
        message: string;
        data: T;
    }
    | {
        success: false;
        data: E;
        message: string;
        error?: unknown;
    };

type WithPageInfoIfArray<T> = Helpers.IsArray<T> extends true
    ? { page_info: { total: number; page: number; size: number } }
    : {};
export { };
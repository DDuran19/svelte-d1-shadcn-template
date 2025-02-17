import { setContext, getContext } from "svelte";
import type { AppPermission } from "$lib/permissions";
import { app } from "$lib/client/app";
import { goto } from "$lib/helpers/goto";
import { replaceToast, showToast } from "$lib/components/ui/sonner";
import { invalidateAll } from "$app/navigation";
import { db } from "./database.svelte";
import { ls } from "$lib/client/local.storage";

const userKey = Symbol("user");

export type UserContextParams = {
    user?: Types.user;
    session_data: Types.Session_data;
};
class UserContext {
    user = $state<Types.user>();
    company_permissions = $state<AppPermission[]>([]);
    company_roles = $state<string[]>([]);
    branch_permissions = $state<AppPermission[]>([]);
    branch_roles = $state<string[]>([]);
    avatar = $derived.by(() => {
        if (!this.user) {
            return "";
        }
        return this.user?.avatar.startsWith("http")
            ? this.user.avatar
            : `/api/assets/${this.user?.avatar}`;
    });
    avatarFallback = $derived.by(() => {
        if (!this.user) {
            return "U";
        }
        return `${this.user.first_name[0]}${this.user.last_name[0]}`.toUpperCase();
    });
    full_name = $derived.by(() => {
        if (!this.user) {
            return "";
        }
        return `${this.user.first_name} ${this.user.last_name}`;
    });

    session_data = $state<Types.Session_data>({});
    permissions = $state<Types.permissions>([]);

    roles = $state<string[]>([]);
    constructor(data: UserContextParams) {
        this.refreshData(data);
        this.reauthenticate.bind(this);
        this.logout.bind(this);
        this.refreshData.bind(this);
    }

    async logout() {
        const confirmed = confirm("Are you sure you want to logout?");
        if (!confirmed) {
            return;
        }
        const result = await app.api.auth
            .$delete({})
            .then(async (res) => await res.json())
            .catch(() => ({
                success: false,
                message: "Logout failed, please try again",
                data: null,
            }));

        if (result.success) {
            this.user = undefined;
            await db.session_data.clear();
            ls().clear();
            await goto("/").then(() => {
                showToast("success", result.message);
            });
        } else {
            showToast("error", result.message);
        }
    }

    async reauthenticate() {
        let toast = showToast("loading", "Re-authenticating...");
        const result = await app.api.auth.refresh
            .$post({})
            .then(async (res) => await res.json())
            .catch(() => ({
                success: false,
                message: "Re-authentication failed, please try again",
                data: null,
            }));

        if (result.success) {
            replaceToast(toast, {
                type: "success",
                message: result.message,
            });
            invalidateAll();
        } else {
            replaceToast(toast, {
                type: "error",
                message: result.message,
            });
        }
    }

    async refreshData(data: UserContextParams) {
        const { session_data, user } = data;
        this.session_data = session_data;
        this.user = user;
    }
}

export function setUserContext(data: UserContextParams) {
    return setContext(userKey, new UserContext(data));
}

export function getUserContext() {
    return getContext<ReturnType<typeof setUserContext>>(userKey);
}

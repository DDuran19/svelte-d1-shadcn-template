export { default as Toaster } from "./sonner.svelte";

import { toast, type ExternalToast } from "svelte-sonner";

/**
 * Show a toast message based on the type provided.
 *
 * @param {"success" | "info" | "error" | "warning" | "loading"} type - The type of toast message. Choices are `"success"`, `"info"`, `"error"`, `"warning"`, and `"loading"`.
 * @param {string} message - The message to display in the toast.
 * @param {Partial<ExternalToast>} data - Additional data for the toast message.
 * @return {string | number} The id of the toast.
 */
export function showToast(
	type: "success" | "info" | "error" | "warning" | "loading",
	message: string,
	data: Partial<ExternalToast> = {}
): string | number {
	let toastFn = toast.info;

	switch (type) {
		case "success":
			toastFn = toast.success;
			break;
		case "info":
			toastFn = toast.info;
			break;
		case "error":
			toastFn = toast.error;
			break;
		case "warning":
			toastFn = toast.warning;
			break;
		case "loading":
			toastFn = toast.loading;
			break;
	}
	return toastFn(message, data);
}

/**
 * Replaces a toast message with a new one.
 *
 * @param {string | number} id - The ID of the toast message to replace.
 * @param {Object} replacement - The new toast message to display.
 * @param {("success" | "info" | "error" | "warning" | "loading")} replacement.type - The type of the new toast message.
 * @param {string} replacement.message - The mes
 * sage to display in the new toast message.
 * @param {Partial<ExternalToast>} [replacement.data] - Additional data for the new toast message.
 * @return {string | number} The ID of the newly displayed toast message.
 */
export function replaceToast(
	id: string | number,
	replacement: {
		type: "success" | "info" | "error" | "warning" | "loading";
		message: string;
		data?: Partial<ExternalToast>;
	}
): string | number {
	toast.dismiss(id);
	return showToast(replacement.type, replacement.message, replacement.data);
}

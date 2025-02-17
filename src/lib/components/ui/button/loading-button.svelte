<script lang="ts">
    import {  type ButtonProps, buttonVariants } from "./index.js";
    import { cn } from "$lib/utils.js";
    import Spinner from "lucide-svelte/icons/loader-circle";

	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
        loading = false,
        spinnerClass = "",
		children,
		...restProps
	}: ButtonProps & { loading?: boolean; spinnerClass?: string } = $props();
</script>
<button
		bind:this={ref}
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{...restProps}
        disabled={loading || restProps.disabled}
	>
    {#if loading}
        <Spinner class={cn("h-4 w-4 animate-spin mr-2", spinnerClass)} />
    {/if}
		{@render children?.()}
	</button>
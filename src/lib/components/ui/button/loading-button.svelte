<script lang="ts">
    import { buttonVariants } from "./index.js";
    import { cn } from "$lib/utils.js";
    import Spinner from "lucide-svelte/icons/loader-circle";
    import type { ButtonProps } from "./button.svelte";

    let {
        class: className,
        variant = "default",
        size = "default",
        ref = $bindable(null),
        href = undefined,
        type = "button",
        children,
        spinnerClass,
        loading,
        ...restProps
    }: ButtonProps & { spinnerClass?: string; loading: boolean } = $props();
</script>

{#if href}
    <a
        bind:this={ref}
        class={cn(buttonVariants({ variant, size }), className)}
        {href}
        {...restProps}
    >
        {#if loading}
            <Spinner class={cn("h-4 w-4 animate-spin mr-2", spinnerClass)} />
        {/if}
        {@render children?.()}
    </a>
{:else}
    <button
        bind:this={ref}
        class={cn(buttonVariants({ variant, size }), className)}
        {type}
        {...restProps}
    >
        {#if loading}
            <Spinner class={cn("h-4 w-4 animate-spin mr-2", spinnerClass)} />
        {/if}
        {@render children?.()}
    </button>
{/if}

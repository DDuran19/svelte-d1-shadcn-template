<script lang="ts">
    import Badge from "$lib/components/ui/badge/badge.svelte";
    import { getFeaturesContext } from "$lib/contexts/features.svelte";
    import { cn } from "$lib/utils";
    import type { Snippet } from "svelte";

    type Props = {
        features: string[];
        class?: string;
        children?: Snippet;
        allowed?: boolean;
    };

    let {
        features,
        class: className,
        children,
        allowed = $bindable(),
    }: Props = $props();
    const featuresContext = getFeaturesContext();
    allowed = featuresContext.isAllowed([...features]).every((value) => value);
</script>

{#if !allowed}
    <Badge class={cn("absolute -right-0 ", className)}>
        {#if children}
            {@render children()}
        {:else}
            Soon!
        {/if}
    </Badge>
{/if}

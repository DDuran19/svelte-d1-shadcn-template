<script lang="ts">
	import "../app.css";
	import LoadingBar from "$lib/components/navigation/LoadingBar.svelte";
	import { Toaster } from "$lib/components/ui/sonner";
	import { setLocalDatabaseContext } from "$lib/contexts/database.svelte";
	import { setUserContext } from "$lib/contexts/user.svelte";
	import { setFeaturesContext } from "$lib/contexts/features.svelte";
	import initStoragePersistence from "$lib/client/dexie.helpers";

	let { children, data } = $props();

	setLocalDatabaseContext();
	setFeaturesContext(data.features);
	const userContext = setUserContext({
		user: data.user,
		session_data: data.session_data,
	});

	$effect(() => {
		(async () => await initStoragePersistence())();
	});
	$effect(() => {
		(async () => userContext.refreshData(data))();
	});
</script>

<Toaster theme="light" richColors />
<LoadingBar />

{@render children?.()}

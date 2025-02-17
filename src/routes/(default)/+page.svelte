<script lang="ts">
    import Login from "$lib/components/pages/Login.svelte";
    import Register from "$lib/components/pages/Register.svelte";
    import Soon from "$lib/components/ui/badge/soon.svelte";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/components/ui/tabs";
    import { db } from "$lib/contexts/database.svelte";

    $effect(() => {
        (async () => await db.session_data.clear())();
    });

    let loginAllowed = $state(false);
    let registerAllowed = $state(false);
</script>

<div class="container mx-auto p-8">
    <Tabs value="login" class="w-[400px] mx-auto">
        <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="login" class="relative" disabled={!loginAllowed}
                >Login
                <Soon features={["login"]} bind:allowed={loginAllowed} />
            </TabsTrigger>
            <TabsTrigger
                value="register"
                class="relative"
                disabled={!registerAllowed}
                >Register
                <Soon features={["register"]} bind:allowed={registerAllowed} />
            </TabsTrigger>
        </TabsList>
        <TabsContent value="login">
            <Login isAllowed={loginAllowed} />
        </TabsContent>
        <TabsContent value="register">
            <Register isAllowed={registerAllowed} />
        </TabsContent>
    </Tabs>
</div>

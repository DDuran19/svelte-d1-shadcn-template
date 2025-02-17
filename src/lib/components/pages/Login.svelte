<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Card from '$lib/components/ui/card/index';
	import * as Form from '$lib/components/ui/form';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	import { superForm } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';
	import { defaults } from 'sveltekit-superforms/client';
	import { replaceToast, showToast } from '../ui/sonner';
	import { goto } from '$lib/helpers/goto';
	import LoadingButton from '../ui/button/loading-button.svelte';
	import { authLoginValidator } from '$lib/common/validators/auth';
	import { app } from '$lib/client/app';
	import { cn } from '$lib/utils';
	import Label from '../ui/label/label.svelte';

	type Props = {
		isAllowed: boolean;
	};

	let { isAllowed }: Props = $props();
	let loginToast = $state<string | number>('');
	let loginMessage = $state<string>('');
	const loginForm = superForm(defaults(zod(authLoginValidator)), {
		id: 'login-form',
		dataType: 'json',
		SPA: true,
		validators: zodClient(authLoginValidator),
		validationMethod: 'oninput',
		resetForm: false,
		onSubmit: async () => {
			loginToast = showToast('info', 'Checking form validity...');
			const jsonData = await loginValidateForm();
			if (jsonData.valid) {
				loginToast = replaceToast(loginToast, {
					type: 'loading',
					message: 'Logging in...',
				});
				const res = await app.api.auth
					.$post({
						json: {
							email: jsonData.data.email,
							password: jsonData.data.password,
						},
					})
					.then(async (res) => await res.json());

				if (res.success) {
					loginToast = replaceToast(loginToast, {
						type: 'success',
						message: res.message,
					});
					await goto('/apps');
				} else {
					loginToast = replaceToast(loginToast, {
						type: 'error',
						message: res.message,
					});
					loginMessage = res.message;
				}
			}
		},
	});

	const {
		form: loginFormData,
		enhance: loginFormEnhance,
		submitting: loginFormSubmitting,
		validateForm: loginValidateForm,
	} = loginForm;

	let showPassword = $state(false);
</script>

<Card.Root
	class={cn('w-full max-w-sm', isAllowed ? '' : 'text-muted-foreground')}
>
	<Card.Header>
		<Card.Title class="text-2xl text-center">App Name</Card.Title
		>
	</Card.Header>
	<Card.Content class="grid gap-4">
		<form method="post" use:loginFormEnhance id="login-form">
			<Form.Field form={loginForm} name="email" id="login-form">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Email</Form.Label>
						<Input
							{...props}
							type="email"
							autocomplete="email"
							disabled={!isAllowed}
							bind:value={$loginFormData.email}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>
					Use the email address you registered with.
				</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field form={loginForm} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Password</Form.Label>
						<Input
							{...props}
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							disabled={!isAllowed}
							bind:value={$loginFormData.password}
						/>
					{/snippet}
				</Form.Control>

				<Form.FieldErrors />
			</Form.Field>

			<Label class="flex items-center gap-2">
				<Checkbox bind:checked={showPassword} />
				Show Password
			</Label>

			{#if loginMessage}
				<p class="text-red-500 text-sm font-semibold">
					{loginMessage}
				</p>
			{/if}
		</form>
	</Card.Content>
	<Card.Footer>
		<!-- <Button class="w-full" type="submit" form="login-form">Sign in</Button> -->
		<LoadingButton
			class="w-full"
			type="submit"
			form="login-form"
			loading={$loginFormSubmitting}
			disabled={!isAllowed}
		>
			Sign in
		</LoadingButton>
	</Card.Footer>
</Card.Root>

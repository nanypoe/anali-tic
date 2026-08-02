<script lang="ts">
	import UploadDatabase from '$lib/components/UploadDatabase.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import TablaEstudiantes from '$lib/components/TablaEstudiantes.svelte';

	// Máquina de estados para la transición entre vistas
	let vistaActual = $state<'subida' | 'cargando' | 'dashboard'>('subida');

	// Subtarea 5.2.1: Garantizar Modo Claro por defecto al iniciar la app
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('dark');
		}
	});

	// Transición suave tras parsear ambos archivos Excel
	function handleTransition() {
		vistaActual = 'cargando';
		setTimeout(() => {
			vistaActual = 'dashboard';
		}, 1000);
	}

	// Reinicia el flujo para subir nuevos archivos
	function reiniciarFlujo() {
		vistaActual = 'subida';
	}
</script>

<main class="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-2 sm:p-3 flex flex-col transition-colors duration-300">
	<div class="w-full flex-grow flex flex-col justify-start">
		{#if vistaActual === 'dashboard'}
			<div class="w-full max-w-[100%] mx-auto flex flex-col gap-2 animate-in fade-in duration-200">
				<TopBar onReiniciar={reiniciarFlujo} />

				<TablaEstudiantes />
			</div>
		{:else}
			<div class="max-w-3xl mx-auto my-auto w-full pt-4">
				<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 min-h-[400px] flex flex-col justify-center">
					{#if vistaActual === 'subida'}
						<UploadDatabase onfilesready={handleTransition} />
					{:else}
						<Loader />
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>
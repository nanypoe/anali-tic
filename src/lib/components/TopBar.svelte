<script lang="ts">
	import { orquestadorStore } from '$lib/stores/orquestador.svelte';

	let { onReiniciar } = $props<{
		onReiniciar?: () => void;
	}>();

	// =========================================================================
	// 1. MODO CLARO POR DEFECTO CON CONMUTADOR OPCIONAL (.dark)
	// =========================================================================
	let esOscuro = $state<boolean>(false);

	$effect(() => {
		if (typeof document !== 'undefined') {
			esOscuro = document.documentElement.classList.contains('dark');
		}
	});

	function toggleTema() {
		esOscuro = !esOscuro;
		if (typeof document !== 'undefined') {
			if (esOscuro) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}

	// =========================================================================
	// 2. LISTA OFICIAL DE MÓDULOS TRANSVERSALES (CHIPS ULTRACOMPACTAS)
	// =========================================================================
	const MODULOS = [
		{ id: 'HIN', nombre: 'Historia e Identidad Nacional', corto: 'HIN' },
		{ id: 'ACC', nombre: 'Adaptación al Cambio Climático', corto: 'ACC' },
		{ id: 'OL', nombre: 'Orientación Laboral', corto: 'OL' },
		{ id: 'IC', nombre: 'Identidad Cultural', corto: 'IC' },
		{ id: 'CP', nombre: 'Cultura de Paz', corto: 'CP' },
		{ id: 'IHSC', nombre: 'Identidad Histórica y Sociocultural de Nicaragua', corto: 'IHSC' }
	];

	// Estados y estadísticas derivadas desde el store
	let est = $derived(orquestadorStore.estadisticas);
	let modoVista = $derived(orquestadorStore.modoVistaTabla);
</script>

<div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 sm:p-3 shadow-xs transition-colors duration-200 flex flex-col gap-2">

	<div class="flex flex-wrap items-center justify-between gap-2">
		
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-2">
				<div class="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
					</svg>
				</div>
				<span class="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Anali-TIC</span>
			</div>

			<div class="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
				<span>Total: <strong class="text-slate-900 dark:text-white font-bold">{est.total}</strong></span>
				<span class="text-slate-300 dark:text-slate-600">•</span>
				<span class="text-emerald-700 dark:text-emerald-400">Completados: <strong>{est.completados ?? est.riesgos.verde}</strong></span>
			</div>
		</div>

		<div class="relative flex-1 max-w-xs min-w-[180px]">
			<svg class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
			</svg>
			<input
				type="text"
				placeholder="Buscar estudiante..."
				value={orquestadorStore.busquedaQuery}
				oninput={(e) => orquestadorStore.setBusquedaQuery(e.currentTarget.value)}
				class="w-full pl-8 pr-3 py-1 bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 text-xs rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
			/>
		</div>

		<div class="flex items-center gap-1.5">
			
			<button
				type="button"
				onclick={() => orquestadorStore.toggleModoVistaTabla()}
				class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition border shadow-2xs cursor-pointer {modoVista === 'numerico' ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'}"
				title="Alternar entre formato numérico y cualitativo"
			>
				{#if modoVista === 'numerico'}
					<svg class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
					</svg>
					<span>Ocultar notas</span>
				{:else}
					<svg class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
					</svg>
					<span>Mostrar calificaciones</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={() => orquestadorStore.toggleMostrarRetirados()}
				class="hidden md:flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium border transition cursor-pointer {orquestadorStore.mostrarRetirados ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800' : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100'}"
				title="Mostrar u ocultar alumnos retirados"
			>
				<span class="w-2 h-2 rounded-full {orquestadorStore.mostrarRetirados ? 'bg-indigo-600' : 'bg-slate-400'}"></span>
				<span class="text-[11px]">Retirados</span>
			</button>

			<button
				type="button"
				onclick={toggleTema}
				class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer"
				title={esOscuro ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
			>
				{#if esOscuro}
					<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
					</svg>
				{:else}
					<svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
					</svg>
				{/if}
			</button>

			{#if onReiniciar}
				<button
					type="button"
					onclick={onReiniciar}
					class="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition cursor-pointer"
					title="Cargar nuevos Excels"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<div class="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-slate-100 dark:border-slate-700/60">
		<span class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider shrink-0 mr-1">
			Módulos:
		</span>
		
		{#each MODULOS as mod (mod.id)}
			{@const esActivo = orquestadorStore.tipoAula === mod.id}
			<button
				type="button"
				onclick={() => orquestadorStore.seleccionarTipoAula(mod.id)}
				class="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer border {esActivo ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-700/70 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600'}"
				title={mod.nombre}
			>
				<span>{mod.corto}</span>
			</button>
		{/each}
	</div>

</div>
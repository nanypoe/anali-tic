<script lang="ts">
	// Subtarea 5.2.1: Props tipadas con Svelte 5
	let { onReiniciar, tipoAula } = $props<{ 
		onReiniciar: () => void, 
		tipoAula: string 
	}>();

	// Derivamos un título amigable basándonos en el ID interno del store
	let titulo = $derived(
		tipoAula === 'transversales' ? 'Análisis de Módulos Transversales' :
		tipoAula === 'identidad' ? 'Análisis de Identidad Institucional' :
		tipoAula === 'cursos_libres' ? 'Análisis de Cursos Libres' :
		'Análisis de Aula MOOC'
	);
</script>

<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
	
	<div>
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
			<svg class="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
			</svg>
			{titulo}
		</h2>
		<p class="text-gray-500 dark:text-gray-400 mt-1 font-medium">Panel de control y seguimiento de estudiantes</p>
	</div>

	<div class="flex flex-wrap md:flex-nowrap items-center gap-4 w-full md:w-auto">
		
		<div class="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm">
			<svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<span class="font-semibold text-sm tracking-wide">Cierre en 15 días</span>
		</div>

		<button 
			onclick={onReiniciar}
			class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 w-full md:w-auto shadow-sm hover:shadow-md active:scale-95"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			Analizar otra aula
		</button>
	</div>
</div>
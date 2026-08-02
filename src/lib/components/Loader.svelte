<script lang="ts">
	// Loader.svelte no necesita estados propios, es puramente visual.
</script>

<div class="flex flex-col items-center justify-center min-h-[400px] w-full animate-in fade-in duration-500">
	<div class="relative flex items-center justify-center">
		<div class="absolute w-24 h-24 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
		
		<div class="absolute w-24 h-24 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
		
		<div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full animate-pulse flex items-center justify-center">
			<svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
		</div>
	</div>

	<h2 class="mt-8 text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
		Anali-TIC está procesando los datos...
	</h2>
	<p class="mt-2 text-gray-500 dark:text-gray-400 font-medium">
		Generando análisis del aula...
	</p>
</div>
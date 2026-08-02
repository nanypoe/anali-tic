<script lang="ts">
    // Subtarea 5.2.2: Consumimos el store centralizado. 
    // Asegúrate de que la ruta coincida con cómo tienes exportado el orquestadorStore
    import { orquestadorStore } from '$lib/stores/orquestador.svelte';
    
    // Extraemos las estadísticas para tener código más limpio en el HTML.
    // Con Svelte 5, si orquestadorStore.estadisticas muta, esto se actualizará solo.
    let est = $derived(orquestadorStore.estadisticas);
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
    
    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
        <div class="flex justify-between items-start">
            <h3 class="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wide uppercase">Total Estudiantes</h3>
            <div class="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
        </div>
        <div class="mt-4">
            <span class="text-5xl font-extrabold text-gray-900 dark:text-white">{est.totalEstudiantes}</span>
        </div>
        <div class="mt-4 flex gap-4 text-sm font-medium">
            <div class="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>{est.activos} Activos</span>
            </div>
            <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <span class="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                <span>{est.retirados} Retirados</span>
            </div>
        </div>
    </div>

    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between lg:col-span-2">
        <div class="flex justify-between items-start">
            <h3 class="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wide uppercase">Avance General (Completitud)</h3>
            <div class="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            </div>
        </div>
        
        <div class="mt-4 flex items-end gap-3">
            <span class="text-5xl font-extrabold text-gray-900 dark:text-white">{est.porcentajeCompletado}%</span>
            <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">Progreso Global</span>
        </div>

        <div class="mt-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
                class="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out relative" 
                style="width: {est.porcentajeCompletado}%">
                <div class="absolute inset-0 bg-white/20 w-full h-full"></div>
            </div>
        </div>
    </div>

    <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 md:col-span-2 lg:col-span-3">
        <h3 class="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wide uppercase mb-5">Distribución de Semáforo (Riesgos)</h3>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div class="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 flex flex-col items-center justify-center text-center transition hover:scale-105">
                <div class="w-4 h-4 rounded-full bg-green-500 mb-2 shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
                <span class="text-3xl font-extrabold text-green-700 dark:text-green-400">{est.riesgos.verde}</span>
                <span class="text-xs font-bold uppercase text-green-600 dark:text-green-500 mt-1">Al día</span>
            </div>
            
            <div class="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 flex flex-col items-center justify-center text-center transition hover:scale-105">
                <div class="w-4 h-4 rounded-full bg-yellow-400 mb-2 shadow-[0_0_12px_rgba(250,204,21,0.6)]"></div>
                <span class="text-3xl font-extrabold text-yellow-700 dark:text-yellow-400">{est.riesgos.amarillo}</span>
                <span class="text-xs font-bold uppercase text-yellow-600 dark:text-yellow-500 mt-1">En riesgo</span>
            </div>

            <div class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 flex flex-col items-center justify-center text-center transition hover:scale-105">
                <div class="w-4 h-4 rounded-full bg-red-500 mb-2 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse"></div>
                <span class="text-3xl font-extrabold text-red-700 dark:text-red-400">{est.riesgos.rojo}</span>
                <span class="text-xs font-bold uppercase text-red-600 dark:text-red-500 mt-1">Crítico</span>
            </div>

            <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex flex-col items-center justify-center text-center transition hover:scale-105">
                <div class="w-4 h-4 rounded-full bg-blue-500 mb-2 shadow-[0_0_12px_rgba(59,130,246,0.5)]"></div>
                <span class="text-3xl font-extrabold text-blue-700 dark:text-blue-400">{est.riesgos.azul}</span>
                <span class="text-xs font-bold uppercase text-blue-600 dark:text-blue-500 mt-1">Convalidado</span>
            </div>

            <div class="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center transition hover:scale-105">
                <div class="w-4 h-4 rounded-full bg-gray-400 dark:bg-gray-500 mb-2"></div>
                <span class="text-3xl font-extrabold text-gray-700 dark:text-gray-300">{est.riesgos.gris}</span>
                <span class="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mt-1">Retirado</span>
            </div>
        </div>
    </div>
</div>
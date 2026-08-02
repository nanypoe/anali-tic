<script lang="ts">
	import { orquestadorStore } from '$lib/stores/orquestador.svelte';
	import type { EstudianteUnificado, RiesgoProtagonista } from '$lib/types';
	import ModalBoleta from '$lib/components/ModalBoleta.svelte';

	// Estado local para la búsqueda rápida por nombre/apellido
	let busqueda = $state('');

	// Estado local para el estudiante seleccionado en el modal
	let estudianteSeleccionado = $state<EstudianteUnificado | null>(null);

	// Filtrado reactivo en tiempo real combinando orquestadorStore + buscador local
	let listaEstudiantes = $derived.by(() => {
		const base = orquestadorStore.estudiantesFiltrados;
		if (!busqueda.trim()) return base;
		
		const query = busqueda.toLowerCase().trim();
		return base.filter((est) => 
			`${est.nombres} ${est.apellidos}`.toLowerCase().includes(query) ||
			est.grupo.toLowerCase().includes(query)
		);
	});

	// Opciones para las pestañas de filtro de riesgo
	const opcionesRiesgo: { id: RiesgoProtagonista | 'Todos'; label: string; colorDot?: string }[] = [
		{ id: 'Todos', label: 'Todos' },
		{ id: 'Verde', label: '🟢 Completados' },
		{ id: 'Amarillo', label: '🟡 En Riesgo' },
		{ id: 'Rojo', label: '🔴 Críticos' },
		{ id: 'Azul', label: '🔵 Convalidados' }
	];

	// Estilos dinámicos para los badges de la tabla
	function getBadgeClasses(riesgo: RiesgoProtagonista) {
		switch (riesgo) {
			case 'Verde':
				return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800';
			case 'Amarillo':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
			case 'Rojo':
				return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
			case 'Azul':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
			case 'Gris':
			default:
				return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
		}
	}

	function getDotColor(riesgo: RiesgoProtagonista) {
		switch (riesgo) {
			case 'Verde': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
			case 'Amarillo': return 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]';
			case 'Rojo': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse';
			case 'Azul': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
			default: return 'bg-gray-400';
		}
	}

	function abrirBoleta(estudiante: EstudianteUnificado) {
		estudianteSeleccionado = estudiante;
	}

	function cerrarBoleta() {
		estudianteSeleccionado = null;
	}
</script>

<div class="mt-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
	
	<div class="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
		
		<div class="relative w-full lg:w-72">
			<svg class="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input 
				type="text"
				bind:value={busqueda}
				placeholder="Buscar estudiante o grupo..."
				class="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
			/>
		</div>

		<div class="flex items-center gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
			{#each opcionesRiesgo as op}
				<button 
					onclick={() => orquestadorStore.setFiltroRiesgo(op.id)}
					class="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${orquestadorStore.filtroRiesgo === op.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}"
				>
					{op.label}
				</button>
			{/each}
		</div>

		<label class="flex items-center gap-3 cursor-pointer self-start lg:self-center select-none">
			<span class="text-xs font-bold text-gray-600 dark:text-gray-300">Mostrar Retirados</span>
			<div class="relative">
				<input 
					type="checkbox"
					checked={orquestadorStore.mostrarRetirados}
					onchange={() => orquestadorStore.toggleMostrarRetirados()}
					class="sr-only peer"
				/>
				<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
			</div>
		</label>

	</div>

	<div class="overflow-x-auto">
		<table class="w-full text-left border-collapse">
			<thead>
				<tr class="bg-gray-50/80 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-[11px] font-bold tracking-wider border-b border-gray-200 dark:border-gray-700">
					<th class="py-4 px-6">Estudiante</th>
					<th class="py-4 px-6">Grupo / Carrera</th>
					<th class="py-4 px-6">Estado / Riesgo</th>
					<th class="py-4 px-6 text-right">Acción</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
				{#each listaEstudiantes as est (est.correo || est.nombres + est.apellidos)}
					<tr 
						onclick={() => abrirBoleta(est)}
						class="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors duration-150 group"
					>
						<td class="py-4 px-6">
							<div class="flex items-center gap-3">
								<span class="w-3 h-3 rounded-full flex-shrink-0 ${getDotColor(est.riesgo)}"></span>
								<div>
									<span class="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
										{est.nombres} {est.apellidos}
									</span>
									<span class="text-xs text-gray-400 dark:text-gray-500 block truncate max-w-[200px]">
										{est.correo || 'Sin correo registrado'}
									</span>
								</div>
							</div>
						</td>

						<td class="py-4 px-6">
							<div class="font-medium text-gray-800 dark:text-gray-200">
								{est.grupo || 'Sin Grupo'}
							</div>
							<div class="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]">
								{est.carrera || 'N/A'}
							</div>
						</td>

						<td class="py-4 px-6">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getBadgeClasses(est.riesgo)}">
								{est.riesgo === 'Verde' ? 'Al Día' : est.riesgo === 'Amarillo' ? 'En Riesgo' : est.riesgo === 'Rojo' ? 'Crítico' : est.riesgo === 'Azul' ? 'Convalidado' : 'Retirado'}
							</span>
						</td>

						<td class="py-4 px-6 text-right">
							<button 
								onclick={(e) => { e.stopPropagation(); abrirBoleta(est); }}
								class="px-3.5 py-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white dark:bg-gray-700 dark:hover:bg-blue-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
							>
								Ver Boleta
							</button>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan="4" class="py-12 text-center text-gray-400 dark:text-gray-500">
							<svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
							<p class="font-medium text-base">No se encontraron estudiantes para los filtros seleccionados.</p>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 flex justify-between items-center">
		<span>Mostrando {listaEstudiantes.length} estudiante(s)</span>
		<span>Anali-TIC v2</span>
	</div>
</div>

<ModalBoleta estudiante={estudianteSeleccionado} onClose={cerrarBoleta} />
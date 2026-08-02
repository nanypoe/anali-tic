<script lang="ts">
	import type { EstudianteUnificado } from '$lib/types';

	// Props en Svelte 5
	let { estudiante, onClose } = $props<{
		estudiante: EstudianteUnificado | null;
		onClose: () => void;
	}>();

	// Mapeo visual para insignias de riesgo dentro del modal
	const configRiesgo: Record<string, { bg: string; text: string; label: string }> = {
		Verde: { bg: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800', text: 'text-green-700 dark:text-green-400', label: 'Al Día / Completado' },
		Amarillo: { bg: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400', label: 'En Riesgo / Pendiente' },
		Rojo: { bg: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800', text: 'text-red-700 dark:text-red-400', label: 'Crítico / Sin Actividad' },
		Azul: { bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', label: 'Convalidado' },
		Gris: { bg: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400', label: 'Retirado' }
	};

	// Manejo de la tecla ESC para cerrar el modal
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if estudiante}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
		onclick={onClose}
		role="presentation"
	>
		<div 
			class="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<div class="px-6 py-5 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
						{estudiante.nombres.charAt(0)}{estudiante.apellidos.charAt(0)}
					</div>
					<div>
						<h3 id="modal-title" class="text-xl font-bold text-gray-900 dark:text-white leading-tight">
							{estudiante.nombres} {estudiante.apellidos}
						</h3>
						<p class="text-xs font-medium text-gray-500 dark:text-gray-400">
							Grupo: {estudiante.grupo || 'Sin Grupo'} | Carrera: {estudiante.carrera || 'N/A'}
						</p>
					</div>
				</div>

				<button 
					onclick={onClose}
					class="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
					aria-label="Cerrar modal"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="p-6 overflow-y-auto space-y-6">
				
				<div>
					<span class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-2">Estado de Riesgo</span>
					<div class="p-3.5 rounded-2xl border flex items-center justify-between font-medium text-sm ${configRiesgo[estudiante.riesgo]?.bg || ''}">
						<div class="flex items-center gap-2.5">
							<span class="w-3 h-3 rounded-full ${estudiante.riesgo === 'Verde' ? 'bg-green-500' : estudiante.riesgo === 'Amarillo' ? 'bg-yellow-400' : estudiante.riesgo === 'Rojo' ? 'bg-red-500' : estudiante.riesgo === 'Azul' ? 'bg-blue-500' : 'bg-gray-400'}"></span>
							<span class="${configRiesgo[estudiante.riesgo]?.text || ''} font-bold">
								{configRiesgo[estudiante.riesgo]?.label || estudiante.riesgo}
							</span>
						</div>
						<span class="text-xs uppercase px-2.5 py-1 rounded-lg font-bold bg-white/60 dark:bg-black/20 border border-current">
							{estudiante.estado}
						</span>
					</div>
				</div>

				<div>
					<span class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-3">Información Académica y Acceso</span>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
						<div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
							<span class="text-xs text-gray-400 dark:text-gray-500 block font-medium">Correo Electrónico</span>
							<span class="font-semibold text-gray-800 dark:text-gray-200 select-all">{estudiante.correo || 'No registrado'}</span>
						</div>
						<div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
							<span class="text-xs text-gray-400 dark:text-gray-500 block font-medium">Teléfono / Celular</span>
							<span class="font-semibold text-gray-800 dark:text-gray-200 select-all">{estudiante.telefono || 'N/A'}</span>
						</div>
						<div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
							<span class="text-xs text-gray-400 dark:text-gray-500 block font-medium">Usuario MOOC/Moodle</span>
							<span class="font-semibold text-gray-800 dark:text-gray-200 select-all">{estudiante.usuario || 'N/A'}</span>
						</div>
						<div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
							<span class="text-xs text-gray-400 dark:text-gray-500 block font-medium">Contraseña Inicial</span>
							<span class="font-mono font-semibold text-gray-800 dark:text-gray-200 select-all">{estudiante.contrasena || 'N/A'}</span>
						</div>
						<div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
							<span class="text-xs text-gray-400 dark:text-gray-500 block font-medium">Código / Carnet</span>
							<span class="font-semibold text-gray-800 dark:text-gray-200">{estudiante.codigo || 'N/A'}</span>
						</div>
						<div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
							<span class="text-xs text-gray-400 dark:text-gray-500 block font-medium">Turno</span>
							<span class="font-semibold text-gray-800 dark:text-gray-200">{estudiante.turno || 'N/A'}</span>
						</div>
					</div>
				</div>

				<div>
					<span class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-3">Detalle de Calificaciones</span>
					{#if estudiante.calificaciones && Object.keys(estudiante.calificaciones).length > 0}
						<div class="space-y-2 max-h-48 overflow-y-auto pr-1">
							{#each Object.entries(estudiante.calificaciones) as [actividad, nota]}
								<div class="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl text-xs border border-gray-100 dark:border-gray-800">
									<span class="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[70%]">{actividad}</span>
									<span class="font-bold px-2 py-1 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
										{nota !== null && nota !== '' ? nota : 'Sin nota'}
									</span>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-xs italic text-gray-400 dark:text-gray-500">No hay detalles individuales de notas cargados.</p>
					{/if}
				</div>

			</div>

			<div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex justify-end">
				<button 
					onclick={onClose}
					class="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
				>
					Cerrar Reporte
				</button>
			</div>
		</div>
	</div>
{/if}
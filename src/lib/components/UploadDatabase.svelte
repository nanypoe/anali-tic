<script lang="ts">
	import * as XLSX from 'xlsx';
	import { motorFusionStore } from '$lib/stores/motorFusion.svelte';

	// 1. Props tipadas con Svelte 5 ($props)
	let { onfilesready } = $props<{ onfilesready?: () => void }>();

	// 2. Estados reactivos con Svelte 5 ($state)
	let arrastrarParticipantes = $state(false);
	let exitoParticipantes = $state(false);
	let errorParticipantes = $state('');

	let arrastrarCalificaciones = $state(false);
	let exitoCalificaciones = $state(false);
	let errorCalificaciones = $state('');

	type FileType = 'participantes' | 'calificaciones';

	// 3. Garantía de Modo Claro por defecto al cargar la subida (Subtarea 5.2.1)
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('dark');
		}
	});

	// 4. Efecto reactivo para disparar la transición al tener ambos archivos
	$effect(() => {
		if (exitoParticipantes && exitoCalificaciones) {
			if (onfilesready) {
				onfilesready();
			}
		}
	});

	/**
	 * Invoca dinámicamente el método correcto en motorFusionStore según el nombre implementado
	 */
	function guardarEnStore(type: FileType, data: any[]) {
		const store = motorFusionStore as any;

		if (type === 'participantes') {
			if (typeof store.cargarParticipantes === 'function') {
				store.cargarParticipantes(data);
			} else if (typeof store.setParticipantes === 'function') {
				store.setParticipantes(data);
			} else if (typeof store.cargarDatos === 'function') {
				store.cargarDatos('participantes', data);
			} else if (typeof store.cargarDatosCrudos === 'function') {
				store.cargarDatosCrudos('participantes', data);
			} else {
				localStorage.setItem('analiTic_participantes', JSON.stringify(data));
			}
		} else {
			if (typeof store.cargarCalificaciones === 'function') {
				store.cargarCalificaciones(data);
			} else if (typeof store.setCalificaciones === 'function') {
				store.setCalificaciones(data);
			} else if (typeof store.cargarDatos === 'function') {
				store.cargarDatos('calificaciones', data);
			} else if (typeof store.cargarDatosCrudos === 'function') {
				store.cargarDatosCrudos('calificaciones', data);
			} else {
				localStorage.setItem('analiTic_calificaciones', JSON.stringify(data));
			}
		}
	}

	function handleFileUpload(file: File, type: FileType) {
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const buffer = e.target?.result as ArrayBuffer;
				const data = new Uint8Array(buffer);
				const workbook = XLSX.read(data, { type: 'array' });
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];
				const jsonData = XLSX.utils.sheet_to_json(worksheet);

				// Guarda los datos usando la función de autodetección de métodos
				guardarEnStore(type, jsonData);

				if (type === 'participantes') {
					exitoParticipantes = true;
					errorParticipantes = '';
				} else {
					exitoCalificaciones = true;
					errorCalificaciones = '';
				}
			} catch (err) {
				console.error(`Error procesando archivo de ${type}:`, err);
				if (type === 'participantes') {
					errorParticipantes = 'Error al leer el Excel de Participantes. Verifica el formato.';
					exitoParticipantes = false;
				} else {
					errorCalificaciones = 'Error al leer el Excel de Calificaciones. Verifica el formato.';
					exitoCalificaciones = false;
				}
			}
		};

		reader.readAsArrayBuffer(file);
	}

	function handleDrop(e: DragEvent, type: FileType) {
		e.preventDefault();
		if (type === 'participantes') arrastrarParticipantes = false;
		if (type === 'calificaciones') arrastrarCalificaciones = false;

		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			const file = e.dataTransfer.files[0];
			handleFileUpload(file, type);
		}
	}

	function handleInputChange(e: Event, type: FileType) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFileUpload(target.files[0], type);
		}
	}
</script>

<div class="w-full max-w-2xl mx-auto flex flex-col gap-6">
	<div class="text-center">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300">
			<span class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
			Anali-TIC v2 • Carga de Archivos
		</div>
		<h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
			Base de Datos Táctica del Aula
		</h1>
		<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
			Selecciona o arrastra los archivos Excel exportados de Moodle para comenzar el análisis.
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div
			class="relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition-all duration-200 text-center bg-white dark:bg-slate-800/80 {arrastrarParticipantes ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md' : exitoParticipantes ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'}"
			ondragover={(e) => { e.preventDefault(); arrastrarParticipantes = true; }}
			ondragleave={() => arrastrarParticipantes = false}
			ondrop={(e) => handleDrop(e, 'participantes')}
		>
			<input
				type="file"
				accept=".xlsx, .xls, .csv, .ods"
				class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
				onchange={(e) => handleInputChange(e, 'participantes')}
			/>

			<div class="p-3 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 mb-2">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 43v-11m0 0L7 20m5-5l5 5m-5 11v8m0 0H8m4 0h4" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
				</svg>
			</div>

			<p class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Paso 1</p>
			<p class="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">Excel Participantes</p>
			<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Nombres, Correo, Grupos y Teléfono</p>

			<div class="mt-3 min-h-[36px] w-full">
				{#if exitoParticipantes}
					<div class="flex items-center justify-center gap-1.5 p-2 bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200 rounded-xl text-xs font-medium">
						<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
						<span>Participantes cargados</span>
					</div>
				{:else if errorParticipantes}
					<div class="p-2 bg-rose-100 border border-rose-300 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200 rounded-xl text-xs font-medium">
						{errorParticipantes}
					</div>
				{:else}
					<span class="inline-block px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300 rounded-lg text-xs font-medium">
						Haz clic o arrastra aquí
					</span>
				{/if}
			</div>
		</div>

		<div
			class="relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition-all duration-200 text-center bg-white dark:bg-slate-800/80 {arrastrarCalificaciones ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md' : exitoCalificaciones ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'}"
			ondragover={(e) => { e.preventDefault(); arrastrarCalificaciones = true; }}
			ondragleave={() => arrastrarCalificaciones = false}
			ondrop={(e) => handleDrop(e, 'calificaciones')}
		>
			<input
				type="file"
				accept=".xlsx, .xls, .csv, .ods"
				class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
				onchange={(e) => handleInputChange(e, 'calificaciones')}
			/>

			<div class="p-3 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 mb-2">
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>

			<p class="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Paso 2</p>
			<p class="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">Excel Calificaciones</p>
			<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Notas de Moodle / Cuestionarios</p>

			<div class="mt-3 min-h-[36px] w-full">
				{#if exitoCalificaciones}
					<div class="flex items-center justify-center gap-1.5 p-2 bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200 rounded-xl text-xs font-medium">
						<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
						<span>Calificaciones cargadas</span>
					</div>
				{:else if errorCalificaciones}
					<div class="p-2 bg-rose-100 border border-rose-300 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200 rounded-xl text-xs font-medium">
						{errorCalificaciones}
					</div>
				{:else}
					<span class="inline-block px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300 rounded-lg text-xs font-medium">
						Haz clic o arrastra aquí
					</span>
				{/if}
			</div>
		</div>
	</div>
</div>
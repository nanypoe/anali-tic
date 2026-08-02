// src/lib/stores/orquestador.svelte.ts

import { motorFusionStore } from '$lib/stores/motorFusion.svelte';
import type { EstudianteUnificado, RiesgoProtagonista } from '$lib/types';
import type { ICerebroAnalitico, EstadisticasAula } from '$lib/cerebros/CerebroBase';
import { CerebroTransversales } from '$lib/cerebros/cerebroTransversales';

/**
 * Tipos de aula soportados por la aplicación.
 */
export type TipoAula = 'transversales' | 'identidad' | 'cursos_libres' | string;

/**
 * Modo de visualización para la matriz de calificaciones en la UI.
 */
export type ModoVistaTabla = 'numerico' | 'textual';

/**
 * Clase OrquestadorStore - Centro Neurálgico Global (Svelte 5 Runes + Patrón Estrategia)
 * Coordina los datos fusionados, la ejecución analítica de los cerebros y los estados de la UI.
 */
class OrquestadorStore {
	// ==========================================
	// 1. ESTADOS REACTIVOS BASE ($state)
	// ==========================================

	/** Identificador del tipo de aula seleccionado por el docente */
	tipoAula = $state<TipoAula>('transversales');

	/** Control de visibilidad de estudiantes con estado 'retirado' */
	mostrarRetirados = $state<boolean>(false);

	/** Filtro secundario de la UI por nivel de riesgo/semáforo */
	filtroRiesgo = $state<RiesgoProtagonista | 'Todos'>('Todos');

	// ==========================================
	// 2. NUEVOS ESTADOS REACTIVOS PARA LA FASE 5
	// ==========================================

	/**
	 * Switch de Privacidad / Modo de vista para las notas en la Tabla Matriarcal.
	 * - 'textual': Muestra 'Aprobado', 'Reprobado', 'Pendiente', 'Convalidado' (Por defecto).
	 * - 'numerico': Muestra los valores numéricos de las notas (ej. 85, 45).
	 */
	modoVistaTabla = $state<ModoVistaTabla>('textual');

	/** Término de búsqueda en tiempo real para filtrar por nombre o apellido */
	busquedaQuery = $state<string>('');

	/** Identificador del módulo transversal/aula activo en pantalla (ej: 'HIN', 'ACC', 'OL', 'IC', 'CP') */
	moduloActivoId = $state<string>('HIN');

	// ==========================================
	// 3. CATALOGO DE CEREBROS (Patrón Estrategia)
	// ==========================================

	private catalogoCerebros: Record<string, ICerebroAnalitico> = {
		transversales: new CerebroTransversales()
		// 💡 Futuros Cerebros:
		// identidad: new CerebroIdentidad(),
		// cursos_libres: new CerebroCursosLibres()
	};

	private cerebroFallback: ICerebroAnalitico = new CerebroTransversales();

	// ==========================================
	// 4. ESTADOS DERIVADOS ($derived) - LÓGICA REACTIVA
	// ==========================================

	/**
	 * Retorna la instancia de ICerebroAnalitico activa según 'tipoAula'.
	 */
	cerebroActivo = $derived.by<ICerebroAnalitico>(() => {
		const cerebro = this.catalogoCerebros[this.tipoAula];
		if (!cerebro) {
			console.warn(
				`[Orquestador] Tipo de aula "${this.tipoAula}" no reconocido. Usando cerebro fallback.`
			);
			return this.cerebroFallback;
		}
		return cerebro;
	});

	/**
	 * Toma los datos unificados crudos de motorFusionStore, ejecuta el análisis
	 * del cerebro activo y retorna los estudiantes enriquecidos con su 'evaluacionMatriz' y 'riesgo'.
	 */
	estudiantesAnalizados = $derived.by<EstudianteUnificado[]>(() => {
		const datosCrudos = motorFusionStore.unificados;
		return this.cerebroActivo.analizar(datosCrudos);
	});

	/**
	 * Métricas globales del aula derivadas del análisis.
	 */
	estadisticas = $derived.by<EstadisticasAula>(() => {
		return this.cerebroActivo.generarEstadisticas(this.estudiantesAnalizados);
	});

	/**
	 * LISTADO FINAL REFACTORIZADO PARA LA TABLA MATRIARCAL:
	 * Aplica una cadena de filtros reactivos en tiempo real:
	 * a) Exclusión/Inclusión de Retirados.
	 * b) Filtro por Semáforo/Riesgo ('Verde', 'Amarillo', 'Rojo', 'Azul', 'Gris').
	 * c) Búsqueda por texto (coincidencia insensible a mayúsculas/minúsculas en nombres y apellidos).
	 */
	estudiantesFiltrados = $derived.by<EstudianteUnificado[]>(() => {
		let resultado = this.estudiantesAnalizados;

		// a) Filtrar Retirados si el switch no está activo
		if (!this.mostrarRetirados) {
			resultado = resultado.filter((est) => est.estado !== 'retirado');
		}

		// b) Filtrar por Semáforo / Riesgo
		if (this.filtroRiesgo !== 'Todos') {
			resultado = resultado.filter((est) => est.riesgo === this.filtroRiesgo);
		}

		// c) Búsqueda por Nombres o Apellidos (Case-Insensitive)
		const queryLimpia = this.busquedaQuery.trim().toLowerCase();
		if (queryLimpia !== '') {
			resultado = resultado.filter((est) => {
				const nombreCompleto = `${est.nombres} ${est.apellidos}`.toLowerCase();
				return nombreCompleto.includes(queryLimpia);
			});
		}

		return resultado;
	});

	// ==========================================
	// 5. MÉTODOS DE ACCIÓN (MUTADORES DE ESTADO)
	// ==========================================

	/** Cambia el tipo de aula seleccionada */
	seleccionarTipoAula(nuevoTipo: TipoAula) {
		this.tipoAula = nuevoTipo;
	}

	/** Alterna la visibilidad de estudiantes retirados */
	toggleMostrarRetirados() {
		this.mostrarRetirados = !this.mostrarRetirados;
	}

	/** Aplica un filtro de categoría por semáforo de riesgo */
	setFiltroRiesgo(riesgo: RiesgoProtagonista | 'Todos') {
		this.filtroRiesgo = riesgo;
	}

	/**
	 * Conmuta entre el modo de vista 'textual' y 'numerico' para las notas.
	 */
	toggleModoVistaTabla() {
		this.modoVistaTabla = this.modoVistaTabla === 'textual' ? 'numerico' : 'textual';
	}

	/**
	 * Asigna explícitamente el modo de vista de calificaciones.
	 */
	setModoVistaTabla(modo: ModoVistaTabla) {
		this.modoVistaTabla = modo;
	}

	/**
	 * Actualiza el término del buscador para filtrar estudiantes en tiempo real.
	 */
	setBusquedaQuery(query: string) {
		this.busquedaQuery = query;
	}

	/**
	 * Cambia el módulo activo en pantalla (ej: 'HIN', 'ACC', 'OL', 'IC', 'CP').
	 */
	setModuloActivo(moduloId: string) {
		this.moduloActivoId = moduloId;
	}
}

/** Exportación Singleton para consumo reactivo global en toda la aplicación */
export const orquestadorStore = new OrquestadorStore();
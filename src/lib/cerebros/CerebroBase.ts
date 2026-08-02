// src/lib/cerebros/CerebroBase.ts

import type { EstudianteUnificado } from '$lib/types';

/**
 * Estadísticas generales del aula procesadas por el cerebro.
 */
export interface EstadisticasAula {
	totalEstudiantes: number;
	activos: number;
	retirados: number;
	riesgos: {
		verde: number;
		amarillo: number;
		rojo: number;
		gris: number;
		azul: number;
	};
	porcentajeCompletado: number;
}

/**
 * ICerebroAnalitico - Contrato base (Patrón Estrategia)
 */
export interface ICerebroAnalitico {
	/**
	 * Procesa la lista de estudiantes unificados calculando y asignando su riesgo global
	 * y enriqueciendo su 'evaluacionMatriz' con la evaluación dual.
	 */
	analizar(estudiantes: EstudianteUnificado[]): EstudianteUnificado[];

	/**
	 * Genera las métricas y estadísticas globales del aula basadas en el análisis.
	 */
	generarEstadisticas(estudiantes: EstudianteUnificado[]): EstadisticasAula;
}
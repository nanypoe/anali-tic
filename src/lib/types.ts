// src/lib/types.ts

// ==========================================
// TIPOS BASE
// ==========================================
export type EstadoProtagonista = 'activo' | 'retirado';
export type RiesgoProtagonista = 'Verde' | 'Gris' | 'Azul' | 'Amarillo' | 'Rojo';

/**
 * Estados textuales individuales por cada cuestionario/actividad
 */
export type EstadoEvaluacion = 'Aprobado' | 'Reprobado' | 'Pendiente' | 'Convalidado';

// ==========================================
// ESTRUCTURA MATRICIAL PARA UI (FASE 5)
// ==========================================
export interface EvaluacionCuestionario {
	idCuestionario: string;
	nombre: string;
	columnaMoodle: string;
	notaNumerica: number | null;
	estadoEvaluacion: EstadoEvaluacion;
	/** Indicador visual de color o clase CSS recomendada ('verde' | 'rojo' | 'amarillo' | 'azul') */
	claseColor: 'verde' | 'rojo' | 'amarillo' | 'azul';
}

export interface EvaluacionUnidad {
	id: string;
	nombreUnidad: string;
	cuestionarios: EvaluacionCuestionario[];
	columnaTotal?: string;
}

export interface EvaluacionModulo {
	id: string; // ej: 'HIN', 'ACC', 'OL', 'IC', 'CP'
	nombreModulo: string;
	convalidado: boolean;
	columnaTotalModulo?: string;
	unidades: EvaluacionUnidad[];
}

// ==========================================
// INTERFAZ: PROTAGONISTA
// ==========================================
export interface Protagonista {
	// DATOS VISUALES (Para la tabla principal)
	nombres: string;
	apellidos: string;
	grupo: string;

	// EL CORE VISUAL (Estado y Semáforo Global)
	estado: EstadoProtagonista;
	riesgo: RiesgoProtagonista;

	// DATOS SENSIBLES (Para Modal / Boleta)
	correo: string;
	telefono: string;
	usuario: string;
	contrasena: string;
	codigo: string;
	turno: string;
	carrera: string;
	genero: string;

	// CONVALIDACIONES
	conv_HIN: 'Si' | 'No';
	conv_ACC: 'Si' | 'No';
	conv_OL: 'Si' | 'No';
	conv_IC: 'Si' | 'No';
	conv_CP: 'Si' | 'No';
	conv_IHS: 'Si' | 'No';
}

// ==========================================
// CALIFICACIONES DINÁMICAS
// ==========================================
export type Calificacion = Record<string, number | string | null>;

// ==========================================
// ESTUDIANTE UNIFICADO (ENRIQUECIDO CON MATRIZ)
// ==========================================
export interface EstudianteUnificado extends Protagonista {
	/** Diccionario dinámico con todas las notas del Excel subido */
	calificaciones: Calificacion;
	
	/** Matriz jerárquica procesada por el Cerebro para el Dashboard (Fase 5) */
	evaluacionMatriz?: EvaluacionModulo[];
}
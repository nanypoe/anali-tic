// src/lib/cerebros/cerebroTransversales.ts

import type {
	EstudianteUnificado,
	RiesgoProtagonista,
	EstadoEvaluacion,
	EvaluacionCuestionario,
	EvaluacionUnidad,
	EvaluacionModulo
} from '$lib/types';
import type { ICerebroAnalitico, EstadisticasAula } from './CerebroBase';

// ============================================================================
// MAPA DE MÓDULOS Y CUESTIONARIOS TRANSVERSALES (I y II Semestre)
// ============================================================================

export interface DefinicionUnidadConfig {
	id: string;
	nombreUnidad: string;
	cuestionarios: { id: string; nombre: string; columnaMoodle: string }[];
	columnaTotal?: string;
}

export interface DefinicionModuloConfig {
	id: 'HIN' | 'ACC' | 'OL' | 'IC' | 'CP' | 'IHS';
	nombreModulo: string;
	columnaTotalModulo?: string;
	unidades: DefinicionUnidadConfig[];
}

export const MAPA_TRANSVERSALES_CONFIG: DefinicionModuloConfig[] = [
	{
		id: 'HIN',
		nombreModulo: 'Historia e Identidad Nacional',
		columnaTotalModulo: 'Total Módulo 1: Historia e Identidad Nacional (Real)',
		unidades: [
			{
				id: 'UD1',
				nombreUnidad: 'Evolución Histórica y Sociocultural de Nicaragua',
				columnaTotal: 'Total Unidad 1: Evolución Historica y Sociocultural de Nicaragua (Real)',
				cuestionarios: [
					{
						id: 'c1_ud1',
						nombre: 'Invasión europea e Independencia',
						columnaMoodle:
							'Cuestionario:Cuestionario UD1: Impacto de la invasión europea, resistencia popular e independencia de Centroamérica y Nicaragua (Real)'
					},
					{
						id: 'c2_ud1',
						nombre: 'Guerra Nacional e influencia británica',
						columnaMoodle:
							'Cuestionario:Cuestionario UD1: La guerra nacional y la influencia británica en el caribe nicaragüense (Real)'
					}
				]
			},
			{
				id: 'UD2',
				nombreUnidad: 'Luchas históricas por la soberanía',
				columnaTotal: 'Total Unidad 2: Luchas históricas por la soberanía y autodeterminación Nacional de Nicaragua (Real)',
				cuestionarios: [
					{
						id: 'c1_ud2',
						nombre: 'Resistencia contra dictadura somocista',
						columnaMoodle: 'Cuestionario:Cuestionario UD2: Resistencia, soberanía y lucha contra la dictadura somocista (Real)'
					},
					{
						id: 'c2_ud2',
						nombre: 'Revolución Popular Sandinista',
						columnaMoodle: 'Cuestionario:Cuestionario UD2: Programa histórico y la Revolución Popular Sandinista (Real)'
					},
					{
						id: 'c3_ud2',
						nombre: 'Estatutos de Autonomía Costa Caribe',
						columnaMoodle: 'Cuestionario:Cuestionario UD2: Estatutos de Autonomía de la Costa Caribe (Real)'
					},
					{
						id: 'c4_ud2',
						nombre: 'Gobiernos neoliberales',
						columnaMoodle: 'Cuestionario:Cuestionario UD2: Políticas de los gobiernos neoliberales (Real)'
					},
					{
						id: 'c5_ud2',
						nombre: 'Transformaciones GRUN',
						columnaMoodle:
							'Cuestionario:Cuestionario UD2: Transformaciones del Gobierno de Reconciliación y Unidad Nacional en un Contexto Global Cambiante (Real)'
					}
				]
			},
			{
				id: 'UD3',
				nombreUnidad: 'Patrimonio histórico, cultural y natural',
				columnaTotal: 'Total Unidad 3: Patrimonio histórico, cultural y natural de Nicaragua (Real)',
				cuestionarios: [
					{
						id: 'c1_ud3',
						nombre: 'El Patrimonio Nacional Nicaragüense',
						columnaMoodle: 'Cuestionario:Cuestionario UD3: El Patrimonio Nacional Nicaragüense (Real)'
					}
				]
			}
		]
	},
	{
		id: 'ACC',
		nombreModulo: 'Adaptación al Cambio Climático',
		columnaTotalModulo: 'Total Módulo 2: Adaptación al Cambio Climático (Real)',
		unidades: [
			{
				id: 'UD1',
				nombreUnidad: 'Gestión ambiental de la contaminación',
				columnaTotal: 'Total Unidad 1: Gestión ambiental de la contaminación y cambio climático (Real)',
				cuestionarios: [
					{
						id: 'c1_ud1',
						nombre: 'Contaminación y Cambio Climático',
						columnaMoodle: 'Cuestionario:Cuestionario UD1: Gestión ambiental de la contaminación y cambio climático. (Real)'
					}
				]
			},
			{
				id: 'UD2',
				nombreUnidad: 'Marco Legal Nacional de Gestión Ambiental',
				columnaTotal: 'Total Unidad 2: Marco Legal Nacional de los Sistemas de Gestión Ambiental (Real)',
				cuestionarios: [
					{
						id: 'c1_ud2',
						nombre: 'Marco Legal de Gestión Ambiental',
						columnaMoodle: 'Cuestionario:Cuestionario UD2: Marco legal Nacional de los Sistemas de Gestión Ambiental. (Real)'
					}
				]
			},
			{
				id: 'UD3',
				nombreUnidad: 'Prácticas ambientales de adaptación',
				columnaTotal: 'Total Unidad 3: Prácticas ambientales en la adaptación del cambio climático. (Real)',
				cuestionarios: [
					{
						id: 'c1_ud3',
						nombre: 'Prácticas de adaptación al cambio climático',
						columnaMoodle: 'Cuestionario:Cuestionario UD3: Prácticas ambientales en la adaptación al cambio climático (Real)'
					}
				]
			},
			{
				id: 'UD4',
				nombreUnidad: 'Gestión de riesgos ante multiamenazas',
				columnaTotal: 'Total Unidad 4: Gestión de riesgos de desastres ante multiamenazas (Real)',
				cuestionarios: [
					{
						id: 'c1_ud4',
						nombre: 'Gestión de riesgos ante multiamenazas',
						columnaMoodle: 'Cuestionario:Cuestionario UD4: Gestión de riesgos de desastres ante multiamenazas (Real)'
					}
				]
			}
		]
	},
	{
		id: 'OL',
		nombreModulo: 'Orientación Laboral',
		columnaTotalModulo: 'Total Módulo 3: Orientación Laboral (Real)',
		unidades: [
			{
				id: 'UD1',
				nombreUnidad: 'Generalidades de la Orientación Laboral',
				columnaTotal: 'Total Unidad 1: Generalidades de la Orientación Laboral (Real)',
				cuestionarios: [
					{
						id: 'c1_ud1',
						nombre: 'Generalidades Orientación Laboral',
						columnaMoodle: 'Cuestionario:Cuestionario UDI: Generalidades de la Orientación Laboral. (Real)'
					}
				]
			},
			{
				id: 'UD2',
				nombreUnidad: 'Marco Legal Laboral',
				columnaTotal: 'Total Unidad 2: Marco Legal Laboral (Real)',
				cuestionarios: [
					{
						id: 'c1_ud2',
						nombre: 'Marco Legal Laboral',
						columnaMoodle: 'Cuestionario:Cuestionario UDII: Marco Legal Laboral (Real)'
					}
				]
			},
			{
				id: 'UD3',
				nombreUnidad: 'Requerimientos en la búsqueda de empleo',
				columnaTotal: 'Total Unidad 3: Requerimientos en la búsqueda de empleo (Real)',
				cuestionarios: [
					{
						id: 'c1_ud3',
						nombre: 'Búsqueda de Empleo',
						columnaMoodle: 'Cuestionario:Cuestionario UDIII: Requerimientos en la búsqueda de empleo. (Real)'
					}
				]
			},
			{
				id: 'UD4',
				nombreUnidad: 'Integración en el trabajo',
				columnaTotal: 'Total Unidad 4: Integración en el trabajo (Real)',
				cuestionarios: [
					{
						id: 'c1_ud4',
						nombre: 'Entrevista Laboral y Capacitación',
						columnaMoodle:
							'Cuestionario:Cuestionario 1 UDIV: Requerimientos en the entrevista laboral y capacitaciones técnica en el área de trabajo (Real)'
					},
					{
						id: 'c2_ud4',
						nombre: 'Educación en Valores Laborales',
						columnaMoodle: 'Cuestionario:Cuestionario 2 UDIV: Educación en Valores (Real)'
					}
				]
			}
		]
	},
	{
		id: 'IC',
		nombreModulo: 'Identidad Cultural',
		columnaTotalModulo: 'Total Módulo Identidad Cultural (Real)',
		unidades: [
			{
				id: 'UD1',
				nombreUnidad: 'Generalidades de la identidad cultural',
				columnaTotal: 'Total Unidad 1: Generalidades de la identidad cultural (Real)',
				cuestionarios: [
					{
						id: 'c1_ud1',
						nombre: 'Conceptos de identidad cultural',
						columnaMoodle: 'Cuestionario:Cuestionario UD1: Conceptos de identidad cultural. (Real)'
					},
					{
						id: 'c2_ud1',
						nombre: 'Importancia identidad cultural',
						columnaMoodle: 'Cuestionario:Cuestionario UD1: Importancia identidad cultural (Real)'
					}
				]
			},
			{
				id: 'UD2',
				nombreUnidad: 'Expresiones de la identidad cultural',
				columnaTotal: 'Total Unidad 2: Expresiones de la identidad cultural en Nicaragua (Real)',
				cuestionarios: [
					{
						id: 'c1_ud2',
						nombre: 'Expresiones Culturales 1',
						columnaMoodle: 'Cuestionario:Cuestionario 1 de la UD2 (Real)'
					},
					{
						id: 'c2_ud2',
						nombre: 'Expresiones Culturales 2',
						columnaMoodle: 'Cuestionario:Cuestionario 2 de la UD2 (Real)'
					}
				]
			},
			{
				id: 'UD3',
				nombreUnidad: 'Marco legal de protección cultural',
				columnaTotal: 'Total Unidad 3: Marco legal para la protección de la identidad cultural de Nicaragua (Real)',
				cuestionarios: [
					{
						id: 'c1_ud3',
						nombre: 'Marco Legal Cultural 1',
						columnaMoodle: 'Cuestionario:Cuestionario 1 de la UD3 (Real)'
					},
					{
						id: 'c2_ud3',
						nombre: 'Marco Legal Cultural 2',
						columnaMoodle: 'Cuestionario:Cuestionario 2 de la UD3 (Real)'
					}
				]
			}
		]
	},
	{
		id: 'CP',
		nombreModulo: 'Cultura de Paz',
		columnaTotalModulo: 'Total Módulo Cultura de Paz (Real)',
		unidades: [
			{
				id: 'UD1',
				nombreUnidad: 'Fundamentos de una cultura de paz',
				columnaTotal: 'Total Unidad 1: Fundamentos de una cultura de paz (Real)',
				cuestionarios: [
					{
						id: 'c1_ud1',
						nombre: 'Ley 985 Cultura de Paz',
						columnaMoodle: 'Cuestionario:Cuestionario UI: Tema 2 Ley 985 Cultura de paz (Real)'
					},
					{
						id: 'c2_ud1',
						nombre: 'Rol del ciudadano en Cultura de Paz',
						columnaMoodle: 'Cuestionario:Cuestionario UI: Tema 3 Rol del ciudadano en la construcción de una cultura de paz (Real)'
					}
				]
			},
			{
				id: 'UD2',
				nombreUnidad: 'Valores en una cultura de paz',
				columnaTotal: 'Total Unidad 2: Valores en una cultura de paz (Real)',
				cuestionarios: [
					{
						id: 'c1_ud2',
						nombre: 'Habilidades Socioemocionales',
						columnaMoodle: 'Cuestionario:Cuestionario UII: Tema2 Habilidades Socioemocionales (Real)'
					},
					{
						id: 'c2_ud2',
						nombre: 'Tipos de Valores',
						columnaMoodle: 'Cuestionario:Cuestionario UII: Tema 3 Tipos de Valores (Real)'
					}
				]
			},
			{
				id: 'UD3',
				nombreUnidad: 'Principios éticos y código de conducta',
				columnaTotal: 'Total Unidad 3: Principios éticos y código de conducta para una cultura de paz (Real)',
				cuestionarios: [
					{
						id: 'c1_ud3',
						nombre: 'Principios y Valores',
						columnaMoodle: 'Cuestionario:Cuestionario UIII: Tema 2 Principios y Valores (Real)'
					},
					{
						id: 'c2_ud3',
						nombre: 'Código de Conducta',
						columnaMoodle: 'Cuestionario:Cuestionario UIII: Tema 3 Fundamentos del Código de conducta (Real)'
					}
				]
			}
		]
	},
	{
		id: 'IHS',
		nombreModulo: 'Identidad Histórica y Sociocultural de Nicaragua',
		columnaTotalModulo: 'Total del curso (Real)',
		unidades: [
			{
				id: 'UD1',
				nombreUnidad: 'Saberes ancentrales y populares de Nicaragua',
				columnaTotal: 'Cuestionario:Act1.2-Cuest-Saberes ancestrales y populares de Nicaragua (Real)',
				cuestionarios: [
					{
						id: 'c1_ud1',
						nombre: 'Saberes ancestrales y populares de Nicaragua',
						columnaMoodle: 'Cuestionario:Act1.2-Cuest-Saberes ancestrales y populares de Nicaragua (Real)'
					}
				]
			},
			{
				id: 'UD2',
				nombreUnidad: 'Espíritu de resistencia por la soberanía y autodeterminación de Benjamín Zeledón a Sandino',
				columnaTotal: 'Cuestionario:Act.2.2-Cuest-Espíritu de resistencia por la soberanía y autodeterminación de Benjamín Zeledón a Sandino (Real)',
				cuestionarios: [
					{
						id: 'c1_ud2',
						nombre: 'Espíritu de resistencia por la soberanía y autodeterminación de Benjamín Zeledón a Sandino',
						columnaMoodle: 'Cuestionario:Act.2.2-Cuest-Espíritu de resistencia por la soberanía y autodeterminación de Benjamín Zeledón a Sandino (Real)'
					}
				]
			},
			{
				id: 'UD3',
				nombreUnidad: 'Lucha del FSLN contra la dictadura militar somocista',
				columnaTotal: 'Cuestionario:Act.3.2-Cuest-La lucha del FSLN contra la dictadura militar somocista (Real)',
				cuestionarios: [
					{
						id: 'c1_ud3',
						nombre: 'Lucha del FSLN contra la dictadura militar somocista',
						columnaMoodle: 'Cuestionario:Act.3.2-Cuest-La lucha del FSLN contra la dictadura militar somocista (Real)'
					}
				]
			},
			{
				id: 'UD4',
				nombreUnidad: 'El Pueblo Presidente a partir de 2007',
				columnaTotal: 'Cuestionario:Act.4.2-Cuest-El Pueblo Presidente a partir de 2007 (Real)',
				cuestionarios: [
					{
						id: 'c1_ud4',
						nombre: 'El Pueblo Presidente a partir de 2007',
						columnaMoodle: 'Cuestionario:Act.4.2-Cuest-El Pueblo Presidente a partir de 2007 (Real)'
					}
				]
			},
		]
	}
];

// ============================================================================
// CLASE DEL CEREBRO TRANSVERSALES
// ============================================================================

export class CerebroTransversales implements ICerebroAnalitico {
	// ==========================================
	// NEURONAS PURAS DE EVALUACIÓN
	// ==========================================

	/**
	 * Neurona 1: Detecta si un módulo está convalidado para el estudiante.
	 */
	private estaModuloConvalidado(
		moduloId: 'HIN' | 'ACC' | 'OL' | 'IC' | 'CP' | 'IHS',
		estudiante: EstudianteUnificado
	): boolean {
		switch (moduloId) {
			case 'HIN':
				return estudiante.conv_HIN === 'Si';
			case 'ACC':
				return estudiante.conv_ACC === 'Si';
			case 'OL':
				return estudiante.conv_OL === 'Si';
			case 'IC':
				return estudiante.conv_IC === 'Si';
			case 'CP':
				return estudiante.conv_CP === 'Si';
            case 'IHS':
                return estudiante.conv_IHS === 'Si';
			default:
				return false;
		}
	}

	/**
	 * Neurona 2: Evaluación Dual por Cuestionario (Matemática + Texto + Color UI).
	 */
	private evaluarCuestionarioIndividual(
		valorRaw: unknown,
		moduloConvalidado: boolean
	): {
		notaNumerica: number | null;
		estadoEvaluacion: EstadoEvaluacion;
		claseColor: 'verde' | 'rojo' | 'amarillo' | 'azul';
	} {
		// Regla de Convalidación Automática
		if (moduloConvalidado) {
			return {
				notaNumerica: 100,
				estadoEvaluacion: 'Convalidado',
				claseColor: 'azul'
			};
		}

		// Regla Pendiente: null, undefined, "", "-", "Sin intentar", o 0
		if (
			valorRaw === null ||
			valorRaw === undefined ||
			valorRaw === '' ||
			valorRaw === '-' ||
			valorRaw === 'Sin intentar'
		) {
			return {
				notaNumerica: null,
				estadoEvaluacion: 'Pendiente',
				claseColor: 'amarillo'
			};
		}

		const num = Number(valorRaw);

		// Si el número es inválido o es 0 -> Estado: 'Pendiente'
		if (isNaN(num) || num === 0) {
			return {
				notaNumerica: num === 0 ? 0 : null,
				estadoEvaluacion: 'Pendiente',
				claseColor: 'amarillo'
			};
		}

		// Regla Aprobado: >= 60
		if (num >= 60) {
			return {
				notaNumerica: num,
				estadoEvaluacion: 'Aprobado',
				claseColor: 'verde'
			};
		}

		// Regla Reprobado: 1..59
		return {
			notaNumerica: num,
			estadoEvaluacion: 'Reprobado',
			claseColor: 'rojo'
		};
	}

	/**
	 * Neurona 3: Construye la matriz estructurada por estudiante para la Fase 5.
	 */
	private construirMatrizEstudiante(estudiante: EstudianteUnificado): EvaluacionModulo[] {
		return MAPA_TRANSVERSALES_CONFIG.map((modConfig) => {
			const convalidado = this.estaModuloConvalidado(modConfig.id, estudiante);

			const unidadesEvaluadas: EvaluacionUnidad[] = modConfig.unidades.map((uniConfig) => {
				const cuestionariosEvaluados: EvaluacionCuestionario[] = uniConfig.cuestionarios.map(
					(qConfig) => {
						const valorRaw = estudiante.calificaciones[qConfig.columnaMoodle];
						const evalDual = this.evaluarCuestionarioIndividual(valorRaw, convalidado);

						return {
							idCuestionario: qConfig.id,
							nombre: qConfig.nombre,
							columnaMoodle: qConfig.columnaMoodle,
							notaNumerica: evalDual.notaNumerica,
							estadoEvaluacion: evalDual.estadoEvaluacion,
							claseColor: evalDual.claseColor
						};
					}
				);

				return {
					id: uniConfig.id,
					nombreUnidad: uniConfig.nombreUnidad,
					cuestionarios: cuestionariosEvaluados,
					columnaTotal: uniConfig.columnaTotal
				};
			});

			return {
				id: modConfig.id,
				nombreModulo: modConfig.nombreModulo,
				convalidado,
				columnaTotalModulo: modConfig.columnaTotalModulo,
				unidades: unidadesEvaluadas
			};
		});
	}

	/**
	 * Neurona 4: Semáforo / Riesgo Global.
	 */
	private calcularRiesgoGlobal(
		estado: string,
		matriz: EvaluacionModulo[]
	): RiesgoProtagonista {
		if (estado === 'retirado') {
			return 'Gris';
		}

		// Extraemos todos los cuestionarios evaluados de la matriz
		const todosLosCuestionarios = matriz.flatMap((m) =>
			m.unidades.flatMap((u) => u.cuestionarios)
		);

		// Si todos los módulos que aplican están convalidados -> Riesgo: 'Azul'
		const todosConvalidados = matriz.every((m) => m.convalidado);
		if (todosConvalidados && matriz.length > 0) {
			return 'Azul';
		}

		// Filtramos solo cuestionarios no convalidados para la evaluación de riesgo
		const cuestionariosReales = matriz
			.filter((m) => !m.convalidado)
			.flatMap((m) => m.unidades.flatMap((u) => u.cuestionarios));

		if (cuestionariosReales.length === 0) {
			return 'Azul';
		}

		const total = cuestionariosReales.length;
		const pendientesOReprobados = cuestionariosReales.filter(
			(q) => q.estadoEvaluacion === 'Pendiente' || q.estadoEvaluacion === 'Reprobado'
		).length;

		const intentados = cuestionariosReales.filter(
			(q) => q.estadoEvaluacion === 'Aprobado' || q.estadoEvaluacion === 'Reprobado'
		).length;

		// 1. Inactivo: 0 cuestionarios intentados
		if (intentados === 0) {
			return 'Azul';
		}

		// 2. Riesgo Alto (Rojo): Más del 50% pendientes o reprobados
		if (pendientesOReprobados > total * 0.5) {
			return 'Rojo';
		}

		// 3. Riesgo Medio (Amarillo): Tiene avance pero con faltantes o reprobaciones
		if (pendientesOReprobados > 0 || intentados < total) {
			return 'Amarillo';
		}

		// 4. Verde: Todo al día y aprobado
		return 'Verde';
	}

	// ============================================================================
	// MÉTODOS DEL CONTRATO (ICerebroAnalitico)
	// ============================================================================

	analizar(estudiantes: EstudianteUnificado[]): EstudianteUnificado[] {
		return estudiantes.map((estudiante) => {
			const evaluacionMatriz = this.construirMatrizEstudiante(estudiante);
			const riesgoCalculado = this.calcularRiesgoGlobal(estudiante.estado, evaluacionMatriz);

			return {
				...estudiante,
				riesgo: riesgoCalculado,
				evaluacionMatriz
			};
		});
	}

	generarEstadisticas(estudiantes: EstudianteUnificado[]): EstadisticasAula {
		const stats: EstadisticasAula = {
			totalEstudiantes: estudiantes.length,
			activos: 0,
			retirados: 0,
			riesgos: {
				verde: 0,
				amarillo: 0,
				rojo: 0,
				gris: 0,
				azul: 0
			},
			porcentajeCompletado: 0
		};

		if (estudiantes.length === 0) return stats;

		let totalCompletitudAcumulada = 0;

		for (const est of estudiantes) {
			if (est.estado === 'retirado') {
				stats.retirados++;
			} else {
				stats.activos++;
			}

			switch (est.riesgo) {
				case 'Verde':
					stats.riesgos.verde++;
					totalCompletitudAcumulada += 100;
					break;
				case 'Amarillo':
					stats.riesgos.amarillo++;
					totalCompletitudAcumulada += 50;
					break;
				case 'Rojo':
					stats.riesgos.rojo++;
					break;
				case 'Gris':
					stats.riesgos.gris++;
					break;
				case 'Azul':
					stats.riesgos.azul++;
					totalCompletitudAcumulada += 100; // Convalidados / Inactivos suman completitud de base
					break;
			}
		}

		const totalCalculable = estudiantes.length > 0 ? estudiantes.length : 1;
		stats.porcentajeCompletado = Number(
			((totalCompletitudAcumulada / (totalCalculable * 100)) * 100).toFixed(1)
		);

		return stats;
	}
}
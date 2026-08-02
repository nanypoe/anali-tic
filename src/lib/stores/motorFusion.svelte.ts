// src/lib/stores/motorFusion.svelte.ts

import { browser } from '$app/environment';
import type { EstudianteUnificado, Protagonista, RiesgoProtagonista } from '$lib/types';

class MotorFusionStore {
	// ==========================================
	// ESTADOS REACTIVOS (Svelte 5 Runes)
	// ==========================================
	
	// La base de datos unificada en memoria
	unificados = $state<EstudianteUnificado[]>([]);
	
	// Control del filtro para la UI
	mostrarRetirados = $state(false);

	// ==========================================
	// ESTADOS DERIVADOS (Filtros en tiempo real)
	// ==========================================
	
	// Retorna los estudiantes excluyendo los retirados (a menos que el usuario indique lo contrario)
	filtrados = $derived.by(() => {
		if (this.mostrarRetirados) {
			return this.unificados;
		}
		return this.unificados.filter((est) => est.estado !== 'retirado');
	});

	constructor() {
		this.fusionarDatos();
	}

	// ==========================================
	// LÓGICA PRINCIPAL (El Cruce / Join)
	// ==========================================
	
	fusionarDatos() {
		// 1. Lectura Segura: Evitamos que esto se ejecute en el servidor (SSR)
		if (!browser) return;

		try {
			const jsonParticipantes = localStorage.getItem('participantes');
			const jsonCalificaciones = localStorage.getItem('calificaciones');

			if (!jsonParticipantes || !jsonCalificaciones) {
				console.warn('Faltan datos en el LocalStorage para la fusión.');
				return;
			}

			const arrParticipantes = JSON.parse(jsonParticipantes);
			const arrCalificaciones = JSON.parse(jsonCalificaciones);

			// 2. Encontrar dinámicamente el nombre de la columna "correo" en las calificaciones
			const columnaCorreoMoodle = this.identificarColumnaCorreo(arrCalificaciones[0]);

			// 3. Crear un Mapa de calificaciones usando el correo como Llave Maestra para búsqueda rápida (O(1))
			const mapaCalificaciones = new Map<string, any>();
			
			for (const filaMoodle of arrCalificaciones) {
				const correoMoodleRaw = filaMoodle[columnaCorreoMoodle];
				if (correoMoodleRaw && typeof correoMoodleRaw === 'string') {
					// Normalizamos la llave: sin espacios y en minúsculas
					const correoLimpio = correoMoodleRaw.trim().toLowerCase();
					mapaCalificaciones.set(correoLimpio, filaMoodle);
				}
			}

			// 4. El Cruce: Mapear participantes y adjuntar sus calificaciones
			this.unificados = arrParticipantes.map((rawPart: any): EstudianteUnificado => {
				const correoParticipante = (rawPart.correo || '').trim().toLowerCase();
				
				// Buscamos si existe ese correo en nuestro mapa de Moodle
				const susNotas = mapaCalificaciones.get(correoParticipante) || {};

				// Mapeamos y retornamos el EstudianteUnificado completo
				return this.construirEstudiante(rawPart, susNotas);
			});

			console.log('¡Fusión completada con éxito!', this.unificados);

		} catch (error) {
			console.error('Error al intentar cruzar las bases de datos:', error);
		}
	}

	// ==========================================
	// MÉTODOS PRIVADOS DE APOYO
	// ==========================================

	/**
	 * Busca dinámicamente cuál es la columna del correo en el Excel de Moodle.
	 */
	private identificarColumnaCorreo(primeraFila: any): string {
		if (!primeraFila) return 'Dirección de correo';
		
		const claves = Object.keys(primeraFila);
		// Buscamos cualquier llave que contenga "correo" o "email"
		const llaveEncontrada = claves.find((k) => 
			k.toLowerCase().includes('correo') || k.toLowerCase().includes('email')
		);

		return llaveEncontrada || 'Dirección de correo'; // Fallback por defecto
	}

	/**
	 * Limpia el dato crudo del participante y lo ensambla con las notas de Moodle.
	 */
	private construirEstudiante(raw: any, notas: any): EstudianteUnificado {
		const estado = raw.estado?.toLowerCase() === 'retirado' ? 'retirado' : 'activo';
		
		// Semáforo inicial
		let riesgo: RiesgoProtagonista = 'Verde';
		if (estado === 'retirado') riesgo = 'Gris';

		return {
			// Datos visuales
			nombres: raw.nombres || '',
			apellidos: raw.apellidos || '',
			grupo: raw.grupo?.toString() || '',
			estado: estado,
			riesgo: riesgo,
			// Datos sensibles
			correo: raw.correo || '',
			telefono: raw.telefono?.toString() || '',
			usuario: raw.usuario || '',
			contrasena: raw.contrasena || '',
			codigo: raw.codigo || '',
			turno: raw.turno || '',
			carrera: raw.carrera || '',
			genero: raw.genero || '',
			// Convalidaciones
			conv_HIN: raw.conv_HIN === 'Si' ? 'Si' : 'No',
			conv_ACC: raw.conv_ACC === 'Si' ? 'Si' : 'No',
			conv_OL: raw.conv_OL === 'Si' ? 'Si' : 'No',
			conv_IC: raw.conv_IC === 'Si' ? 'Si' : 'No',
			conv_CP: raw.conv_CP === 'Si' ? 'Si' : 'No',
			conv_IHS: raw.conv_IHS === 'Si' ? 'Si' : 'No',
			
			// EL CRUCE: Adherimos el Record dinámico de calificaciones
			calificaciones: notas
		};
	}
}

// Exportamos el singleton para que la app y los Mini-Cerebros lo consuman
export const motorFusionStore = new MotorFusionStore();
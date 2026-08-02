import { browser } from '$app/environment';
import type { Protagonista } from '$lib/types';

class ProtagonistasStore {
	// Estado reactivo central (Usando runas de Svelte 5)
	data = $state<Protagonista[]>([]);
	
	// Control del filtro para la UI
	mostrarRetirados = $state(false);

	// Computed property: se recalcula automáticamente cuando cambian los datos o el filtro
	filtrados = $derived.by(() => {
		if (this.mostrarRetirados) {
			return this.data;
		}
		// Por defecto excluye a los retirados
		return this.data.filter((p) => p.estado !== 'retirado');
	});

	constructor() {
		this.cargarDatos();
	}

	// Método para leer del LocalStorage
	cargarDatos() {
		// Evitamos errores de SSR asegurándonos de que estamos en el navegador
		if (!browser) return;
		
		// En la Fase 2 estableciste que el Excel guardaba esto bajo 'participantes'
		const jsonCrudo = localStorage.getItem('participantes');
		
		if (jsonCrudo) {
			try {
				const parseado = JSON.parse(jsonCrudo);
				// Mapeamos el JSON inseguro a nuestra interfaz estricta
				this.data = parseado.map(this.mapearProtagonista);
			} catch (e) {
				console.error('Error leyendo protagonistas de localStorage:', e);
			}
		}
	}

	// Método privado para limpiar y estandarizar el dato crudo
	private mapearProtagonista(raw: any): Protagonista {
		// Normalizamos el estado
		const estado = raw.estado?.toLowerCase() === 'retirado' ? 'retirado' : 'activo';
		
		// Lógica inicial para el Semáforo de Riesgo
		let riesgo: Protagonista['riesgo'] = 'Verde'; // Verde por defecto para los activos
		
		if (estado === 'retirado') {
			riesgo = 'Gris'; // Los retirados siempre son Gris
		} 
		// Nota: El azul (convalidados) se implementará más adelante evaluando 
		// el módulo actual activo en la UI contra sus flags (conv_HIN, etc).
		// El amarillo y rojo se evaluarán cuando incorporemos las calificaciones.

		return {
			nombres: raw.nombres || '',
			apellidos: raw.apellidos || '',
			grupo: raw.grupo?.toString() || '',
			estado: estado,
			riesgo: riesgo,
			correo: raw.correo || '',
			telefono: raw.telefono?.toString() || '',
			usuario: raw.usuario || '',
			contrasena: raw.contrasena || '',
			codigo: raw.codigo || '',
			turno: raw.turno || '',
			carrera: raw.carrera || '',
			genero: raw.genero || '',
			conv_HIN: raw.conv_HIN === 'Si' ? 'Si' : 'No',
			conv_ACC: raw.conv_ACC === 'Si' ? 'Si' : 'No',
			conv_OL: raw.conv_OL === 'Si' ? 'Si' : 'No',
			conv_IC: raw.conv_IC === 'Si' ? 'Si' : 'No',
			conv_CP: raw.conv_CP === 'Si' ? 'Si' : 'No',
			conv_IHS: raw.conv_IHS === 'Si' ? 'Si' : 'No'
		};
	}
}

// Exportamos una única instancia (Singleton) para usarla en toda la aplicación
export const protagonistas = new ProtagonistasStore();
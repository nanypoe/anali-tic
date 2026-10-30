/* js/ui/paletaModulos.js */

/** Color de cada módulo, por orden de aparición en la configuración del aula. Compartido por la app y los Excel. */
export const COLORES_MODULO = ["5B3DF5", "0EA5E9", "14B8A6", "F97316", "EC4899", "84CC16", "A855F7", "EF4444"];

export const colorModulo = (indice) => COLORES_MODULO[indice % COLORES_MODULO.length];

/** Mezcla un color (RRGGBB) con blanco. proporcion 1 = color puro, 0 = blanco. Devuelve ARGB para ExcelJS. */
export function tintar(rrggbb, proporcion) {
  const canales = [0, 2, 4].map((i) => parseInt(rrggbb.slice(i, i + 2), 16));
  const mezcla = canales.map((c) => Math.round(c * proporcion + 255 * (1 - proporcion)));
  return `FF${mezcla.map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

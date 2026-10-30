/* js/ui/formatoBase.js */

/**
 * Formato único de las bases de datos de Anali-TIC. La plantilla descargable y
 * la base actualizada que se exporta desde Gestionar usan estas mismas reglas.
 */

import { COLOR } from "./excelEstilos.js";

const FUENTE = { name: "Arial", size: 12 };
const ALTO_CABECERA = 62;
const ANCHO_CONVALIDACION = 42;
const ANCHO_POR_DEFECTO = 150;

const columna = (nombre, px, vertical = false) => ({ nombre, px, vertical });

export const COLUMNAS_TIC = [
  columna("Centro", 72),
  columna("Turno", 81),
  columna("Carrera", 108),
  columna("Grupos", 39, true),
  columna("Código", 145),
  columna("Protagonista", 421),
  columna("Correo electrónico", 424),
  columna("Usuario", 222),
  columna("Teléfono", 115),
  columna("Estado", 102),
  ...["conv_HIN", "conv_ACC", "conv_OL", "conv_IC", "conv_CP", "conv_IHS"].map((c) => columna(c, ANCHO_CONVALIDACION, true)),
];

export const COLUMNAS_VIRTUAL = [
  columna("Nombres y apellidos", 421),
  columna("Correo electrónico", 424),
  columna("Grupos", 420),
];

const normalizar = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

/** Ancho en píxeles (como se ve en Excel) a unidades de columna de ExcelJS. */
const pxAChars = (px) => Math.round(((px - 5) / 7) * 100) / 100;

/** Ancho y orientación de una columna según su nombre. Las columnas no reconocidas usan el ancho por defecto. */
function definicionDe(nombre, referencia) {
  const clave = normalizar(nombre);
  const conocida = referencia.find((c) => normalizar(c.nombre) === clave);
  if (conocida) return conocida;
  if (clave.startsWith("conv_")) return columna(nombre, ANCHO_CONVALIDACION, true);
  return columna(nombre, ANCHO_POR_DEFECTO);
}

/**
 * Crea una hoja con el formato de la plantilla: encabezados en negrita, Arial 12,
 * filtro automático y anchos fijos. Si no se pasan columnas, usa las de la plantilla.
 * @returns {ExcelJS.Worksheet}
 */
export function crearHojaBase(libro, { nombre = "Estudiantes", esTic, columnas, filas = [] }) {
  const referencia = esTic ? COLUMNAS_TIC : COLUMNAS_VIRTUAL;
  const nombres = columnas || referencia.map((c) => c.nombre);
  const definiciones = nombres.map((n) => definicionDe(n, referencia));

  const ws = libro.addWorksheet(nombre);
  ws.columns = definiciones.map((d) => ({
    header: d.nombre,
    key: d.nombre,
    width: pxAChars(d.px),
    style: { font: FUENTE },
  }));

  filas.forEach((fila) => {
    ws.addRow(nombres.map((n) => (fila[n] === "" ? null : fila[n] ?? null)));
  });

  const cabecera = ws.getRow(1);
  cabecera.height = ALTO_CABECERA;
  cabecera.eachCell((celda, numero) => {
    celda.font = { ...FUENTE, bold: true, color: { argb: COLOR.tinta } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.primarioClaro } };
    celda.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
      textRotation: definiciones[numero - 1].vertical ? 90 : 0,
    };
  });

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: nombres.length },
  };
  return ws;
}

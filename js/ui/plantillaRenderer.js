/* js/ui/plantillaRenderer.js */

import { listarCentros, listarCarreras } from "../core/diccionarios.js";
import { crearLibro, descargarLibro } from "./excelEstilos.js";
import { crearHojaBase } from "./formatoBase.js";

function instruccionesTic() {
  return [
    ["CAMPO", "VALORES VÁLIDOS / DESCRIPCIÓN"],
    ["Centro", "Código del centro (use exactamente uno):"],
    ...listarCentros().map((c) => ["", `${c.codigo}  →  ${c.nombre}`]),
    ["Turno", "matutino, vespertino, nocturno, sabatino, dominical, virtual (virtual para cualquier curso)"],
    ["Carrera", "Forma corta del diccionario. Si tiene nombre completo, se usa en las exportaciones:"],
    ...listarCarreras().map((c) => ["", `${c.clave}  →  ${c.nombreCompleto || "(pendiente de nombre completo)"}`]),
    ["Grupos", "Número del grupo (por ejemplo G01)"],
    ["Código", "Código del grupo (libre)"],
    ["Protagonista", "Nombre completo tal como aparece en el Campus"],
    ["Correo electrónico", "Debe coincidir con el correo del reporte de calificaciones del Campus"],
    ["Usuario", "Usuario del Campus"],
    ["Teléfono", "Número sin el código de país (se usa en WhatsApp)"],
    ["Estado", "Activo o Retirado"],
    ["conv_HIN, conv_ACC, conv_OL, conv_IC, conv_CP, conv_IHS", "Sí = convalidado. No o vacío = no convalidado"],
  ];
}

function instruccionesVirtual() {
  return [
    ["CAMPO", "DESCRIPCIÓN"],
    ["Nombres y apellidos", "Nombre completo del protagonista"],
    ["Correo electrónico", "Debe coincidir con el correo del reporte de calificaciones del Campus"],
    ["Grupos", "Grupo o curso al que pertenece (texto libre)"],
  ];
}

/** Hoja de instrucciones: dos columnas, la primera en negrita. */
function hojaDeInstrucciones(libro, filas, anchos) {
  const ws = libro.addWorksheet("Instrucciones");
  ws.columns = anchos.map((ancho) => ({ width: ancho, style: { font: { name: "Arial", size: 12 } } }));
  filas.forEach((fila) => ws.addRow(fila));

  ws.getRow(1).eachCell((celda) => {
    celda.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B3DF5" } };
  });
  ws.getColumn(1).eachCell((celda, numero) => {
    if (numero > 1) celda.font = { name: "Arial", size: 12, bold: true };
  });
  ws.eachRow((fila) => {
    fila.eachCell((celda) => {
      celda.alignment = { vertical: "top", wrapText: true };
    });
  });
  return ws;
}

function verificarExcelJs() {
  if (typeof ExcelJS !== "undefined") return true;
  alert("No se pudo cargar ExcelJS para generar la plantilla.");
  return false;
}

/** Plantilla para el Docente TIC: base completa con gestión de estado y convalidaciones. */
export async function descargarPlantillaTic() {
  if (!verificarExcelJs()) return;
  const libro = crearLibro();
  crearHojaBase(libro, { esTic: true });
  hojaDeInstrucciones(libro, instruccionesTic(), [{ width: 44 }, { width: 90 }]);
  await descargarLibro(libro, "Plantilla_BaseDatos_TIC.xlsx");
}

/** Plantilla para el Docente Virtual: solo nombre, correo y grupos. */
export async function descargarPlantillaVirtual() {
  if (!verificarExcelJs()) return;
  const libro = crearLibro();
  crearHojaBase(libro, { esTic: false });
  hojaDeInstrucciones(libro, instruccionesVirtual(), [{ width: 26 }, { width: 90 }]);
  await descargarLibro(libro, "Plantilla_BaseDatos_Virtual.xlsx");
}

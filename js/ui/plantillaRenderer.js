/* js/ui/plantillaRenderer.js */

import { listarCentros, listarCarreras } from "../core/diccionarios.js";

const COLUMNAS_TIC = [
  "Centro",
  "Turno",
  "Carrera",
  "Código",
  "Protagonista",
  "Correo electrónico",
  "Usuario",
  "Teléfono",
  "Estado",
  "conv_HIN",
  "conv_ACC",
  "conv_OL",
  "conv_IHS",
  "conv_IC",
  "conv_CP",
];

const COLUMNAS_VIRTUAL = ["Nombres y apellidos", "Correo electrónico", "Grupos"];

function instruccionesTic() {
  const filas = [
    ["CAMPO", "VALORES VÁLIDOS / DESCRIPCIÓN"],
    ["Centro", "Código del centro (use exactamente uno):"],
    ...listarCentros().map((c) => ["", `${c.codigo}  →  ${c.nombre}`]),
    ["Turno", "matutino, vespertino, nocturno, sabatino, dominical, virtual (virtual para cualquier curso)"],
    ["Carrera", "Forma corta del diccionario. Si tiene nombre completo, se usa en las exportaciones:"],
    ...listarCarreras().map((c) => ["", `${c.clave}  →  ${c.nombreCompleto || "(pendiente de nombre completo)"}`]),
    ["Código", "Código del grupo (libre, por ejemplo G01)"],
    ["Protagonista", "Nombre completo tal como aparece en el Campus"],
    ["Correo electrónico", "Debe coincidir con el correo del reporte de calificaciones del Campus"],
    ["Usuario", "Usuario del Campus"],
    ["Teléfono", "Número sin el código de país (se usa en WhatsApp)"],
    ["Estado", "Activo o Retirado"],
    ["conv_HIN, conv_ACC, conv_OL, conv_IHS, conv_IC, conv_CP", "Sí = convalidado. No o vacío = no convalidado"],
  ];
  return filas;
}

function instruccionesVirtual() {
  return [
    ["CAMPO", "DESCRIPCIÓN"],
    ["Nombres y apellidos", "Nombre completo del protagonista"],
    ["Correo electrónico", "Debe coincidir con el correo del reporte de calificaciones del Campus"],
    ["Grupos", "Grupo o curso al que pertenece (texto libre)"],
  ];
}

function descargar(libro, nombre) {
  const bytes = XLSX.write(libro, { bookType: "xlsx", type: "array" });
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Plantilla para el Docente TIC: base completa con gestión de estado y convalidaciones. */
export function descargarPlantillaTic() {
  if (typeof XLSX === "undefined") return alert("No se pudo cargar SheetJS.");
  const libro = XLSX.utils.book_new();
  const datos = XLSX.utils.aoa_to_sheet([COLUMNAS_TIC]);
  datos["!cols"] = COLUMNAS_TIC.map((c) => ({ wch: Math.max(14, c.length + 2) }));
  XLSX.utils.book_append_sheet(libro, datos, "Estudiantes");
  const instr = XLSX.utils.aoa_to_sheet(instruccionesTic());
  instr["!cols"] = [{ wch: 44 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(libro, instr, "Instrucciones");
  descargar(libro, "Plantilla_BaseDatos_TIC.xlsx");
}

/** Plantilla para el Docente Virtual: solo nombre, correo y grupos. */
export function descargarPlantillaVirtual() {
  if (typeof XLSX === "undefined") return alert("No se pudo cargar SheetJS.");
  const libro = XLSX.utils.book_new();
  const datos = XLSX.utils.aoa_to_sheet([COLUMNAS_VIRTUAL]);
  datos["!cols"] = [{ wch: 36 }, { wch: 34 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(libro, datos, "Estudiantes");
  const instr = XLSX.utils.aoa_to_sheet(instruccionesVirtual());
  instr["!cols"] = [{ wch: 26 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(libro, instr, "Instrucciones");
  descargar(libro, "Plantilla_BaseDatos_Virtual.xlsx");
}

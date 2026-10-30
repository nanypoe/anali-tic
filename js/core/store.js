// js/core/store.js

/**
 * Estado de la sesión de análisis.
 *
 * - Mantiene la base de datos cargada (filas originales, mutables) y las calificaciones.
 * - Registra cada cambio manual (Estado Activo/Retirado y convalidaciones) sobre la fila
 *   de la base de datos, para poder exportarla después.
 * - Guarda los cambios en localStorage, asociados al nombre y tamaño del archivo,
 *   así no se pierden al recargar la página.
 */

import {
  analizarEstudiantes,
  obtenerValorCampo,
  CLAVES_CORREO,
} from "./analyzer.js";

const CLAVES_ESTADO = ["estado", "status"];
const PREFIJO_STORAGE = "anali-tic:cambios:v1:";

const sesion = {
  nombreArchivo: "",
  dbData: [],
  dbColumnas: [],
  gradesData: [],
  configAula: null,
  tipoBase: "basica",
  cambios: [],
  estudiantes: [],
};

function normalizarClave(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "")
    .trim();
}

/**
 * Clasifica la base de datos: "tic" si trae columnas de gestión
 * (estado, centro, turno, carrera, código o convalidaciones), "basica" si solo
 * trae nombre, correo y grupos.
 */
export function detectarTipoBase(columnas = []) {
  const normalizadas = columnas.map(normalizarClave);
  const esTic = normalizadas.some(
    (c) =>
      ["estado", "centro", "turno", "carrera", "codigo", "usuario", "telefono"].includes(c) ||
      c.startsWith("conv"),
  );
  return esTic ? "tic" : "basica";
}

function correoDeFila(fila) {
  return obtenerValorCampo(fila, CLAVES_CORREO).toLowerCase();
}

function claveStorage() {
  return `${PREFIJO_STORAGE}${sesion.nombreArchivo}:${sesion.dbData.length}`;
}

function guardarCambios() {
  try {
    const clave = claveStorage();
    if (sesion.cambios.length === 0) {
      localStorage.removeItem(clave);
      return;
    }
    const payload = sesion.cambios.map(({ fila, columna, valor, original, correo }) => ({
      fila,
      columna,
      valor,
      original,
      correo,
    }));
    localStorage.setItem(clave, JSON.stringify(payload));
  } catch (error) {
    console.warn("No se pudieron guardar los cambios en localStorage:", error);
  }
}

function leerCambiosGuardados() {
  try {
    const raw = localStorage.getItem(claveStorage());
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Busca la fila correcta para un cambio guardado. Primero se confía en el índice;
 * si el correo ya no coincide, se busca la primera fila con ese correo.
 */
function localizarFila(cambio) {
  const candidata = sesion.dbData[cambio.fila];
  if (candidata && correoDeFila(candidata) === cambio.correo) return cambio.fila;
  return sesion.dbData.findIndex((f) => correoDeFila(f) === cambio.correo);
}

/**
 * Devuelve la clave real de la columna en la fila (ignora mayúsculas, tildes y espacios).
 * Si no existe, la crea con el nombre canónico.
 */
function resolverColumna(fila, candidatos, canonico) {
  const normCandidatos = candidatos.map(normalizarClave);
  const real = Object.keys(fila).find((k) => normCandidatos.includes(normalizarClave(k)));
  if (real) return real;

  if (!sesion.dbColumnas.some((c) => normalizarClave(c) === normalizarClave(canonico))) {
    sesion.dbColumnas.push(canonico);
  }
  fila[canonico] = "";
  return canonico;
}

function recalcular() {
  sesion.estudiantes = analizarEstudiantes(
    sesion.dbData,
    sesion.gradesData,
    sesion.configAula,
  );
  return sesion.estudiantes;
}

/**
 * Inicia una sesión con los datos parseados y reaplica los cambios guardados.
 * @returns {{ estudiantes: Array, cambiosRestaurados: number }}
 */
export function iniciarSesion({ nombreArchivo, dbData, dbColumnas, gradesData, configAula }) {
  sesion.nombreArchivo = nombreArchivo;
  sesion.dbData = dbData;
  sesion.dbColumnas = [...dbColumnas];
  sesion.gradesData = gradesData;
  sesion.configAula = configAula;
  sesion.tipoBase = detectarTipoBase(dbColumnas);
  sesion.cambios = [];

  let restaurados = 0;
  leerCambiosGuardados().forEach((c) => {
    const fi = localizarFila(c);
    if (fi < 0) return;
    const fila = sesion.dbData[fi];
    const original = fila[c.columna] ?? "";
    fila[c.columna] = c.valor;
    sesion.cambios.push({ fila: fi, columna: c.columna, valor: c.valor, original, correo: c.correo });
    restaurados++;
  });

  return { estudiantes: recalcular(), cambiosRestaurados: restaurados };
}

/**
 * Registra un cambio manual.
 * @param {Object} estudiante - Estudiante analizado (usa su infoDb).
 * @param {"estado"|"convalidacion"} tipo
 * @param {string} valor - "Activo" | "Retirado" para estado, "Sí" | "No" para convalidación.
 * @param {string} [modulo] - Nombre del módulo cuando tipo es convalidación.
 */
export function registrarCambio(estudiante, tipo, valor, modulo = null) {
  const fila = estudiante?.infoDb;
  if (!fila) {
    throw new Error("Este estudiante no tiene registro en la base de datos cargada.");
  }
  const fi = sesion.dbData.indexOf(fila);
  if (fi < 0) throw new Error("No se encontró la fila del estudiante en la base de datos.");

  let columna;
  if (tipo === "estado") {
    columna = resolverColumna(fila, CLAVES_ESTADO, "Estado");
  } else {
    const campo = sesion.configAula?.convalidaciones_map?.[modulo];
    if (!campo) throw new Error(`El módulo "${modulo}" no tiene convalidación configurada.`);
    const acronimo = campo.replace("conv_", "");
    columna = resolverColumna(
      fila,
      [campo, modulo, acronimo, `conv_${modulo}`, `convalidacion ${acronimo}`, `convalidacion_${acronimo}`],
      campo,
    );
  }

  const previo = sesion.cambios.find((c) => c.fila === fi && c.columna === columna);
  const original = previo ? previo.original : fila[columna] ?? "";
  sesion.cambios = sesion.cambios.filter((c) => !(c.fila === fi && c.columna === columna));

  fila[columna] = valor;
  if (String(original) !== String(valor)) {
    sesion.cambios.push({ fila: fi, columna, valor, original, correo: correoDeFila(fila) });
  }

  guardarCambios();
  return recalcular();
}

/** Revierte todos los cambios manuales de la sesión. */
export function descartarCambios() {
  sesion.cambios.forEach((c) => {
    sesion.dbData[c.fila][c.columna] = c.original;
  });
  sesion.cambios = [];
  guardarCambios();
  return recalcular();
}

/** Columnas y filas listas para escribir en Excel, incluyendo columnas nuevas. */
export function obtenerBaseParaExportar() {
  const columnas = [...sesion.dbColumnas];
  if (sesion.dbData[0]) {
    Object.keys(sesion.dbData[0]).forEach((k) => {
      if (!columnas.includes(k)) columnas.push(k);
    });
  }
  return { columnas, filas: sesion.dbData };
}

export const getEstudiantes = () => sesion.estudiantes;
export const getConfigAula = () => sesion.configAula;
export const getTipoBase = () => sesion.tipoBase;
export const getCambios = () => sesion.cambios;
export const getNombreArchivo = () => sesion.nombreArchivo;

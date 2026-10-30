// js/core/diccionarios.js

/**
 * Diccionarios editables en config/diccionarios/.
 * Se cargan una sola vez al iniciar la app y resuelven los códigos cortos
 * de la base de datos (centro, carrera) en sus nombres completos.
 */

let centros = {};
let carreras = {};
let sistema = { anio_academico: new Date().getFullYear(), contrasena_por_defecto: "" };
let cargado = false;

function normalizarClave(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export async function cargarDiccionarios() {
  if (cargado) return;
  const [resCentros, resCarreras, resSistema] = await Promise.all([
    fetch("./config/diccionarios/centros.json"),
    fetch("./config/diccionarios/carreras.json"),
    fetch("./config/sistema.json"),
  ]);
  centros = resCentros.ok ? await resCentros.json() : {};
  carreras = resCarreras.ok ? await resCarreras.json() : {};
  sistema = resSistema.ok ? { ...sistema, ...(await resSistema.json()) } : sistema;
  cargado = true;
}

/**
 * Devuelve { codigo, nombre, municipio } para un código de centro (ctche, subsede, ctfabretto).
 * Si el código no existe en el diccionario, devuelve null.
 */
export function resolverCentro(codigo) {
  const clave = normalizarClave(codigo);
  if (!clave) return null;
  const encontrada = Object.keys(centros).find((k) => normalizarClave(k) === clave);
  return encontrada ? { codigo: encontrada, ...centros[encontrada] } : null;
}

/**
 * Centro más frecuente entre los estudiantes analizados (ignora retirados).
 * Devuelve el código del diccionario o "" si no hay dato.
 */
export function centroPredominante(estudiantes) {
  const conteo = new Map();
  (estudiantes || []).forEach((est) => {
    if (est?.estadoEstudiante === "retirado") return;
    const codigo = est?.grupoInfo?.centroCodigo;
    if (codigo) conteo.set(codigo, (conteo.get(codigo) || 0) + 1);
  });
  let mejor = "";
  let max = 0;
  conteo.forEach((n, codigo) => {
    if (n > max) {
      max = n;
      mejor = codigo;
    }
  });
  return mejor;
}

/**
 * Devuelve el nombre completo de la carrera o null si no está definido.
 * Acepta la forma corta ("zootecnia", "Zootecnia", "diseño") o ya el nombre completo.
 */
export function resolverCarrera(valor) {
  const clave = normalizarClave(valor);
  if (!clave) return null;
  const entradas = Object.entries(carreras).filter(([k]) => !k.startsWith("_"));

  const porClave = entradas.find(([k]) => normalizarClave(k) === clave);
  if (porClave) return porClave[1] || null;

  const porNombreCompleto = entradas.find(
    ([, v]) => v && normalizarClave(v) === clave,
  );
  return porNombreCompleto ? porNombreCompleto[1] : null;
}

/** Lista de centros para llenar selectores: [{ codigo, nombre, municipio }] */
export function listarCentros() {
  return Object.entries(centros).map(([codigo, info]) => ({
    codigo,
    nombre: info.nombre,
    municipio: info.municipio,
  }));
}

/** Carreras con su nombre completo, para revisar cuáles faltan por completar. */
export function listarCarrerasPendientes() {
  return Object.entries(carreras)
    .filter(([k, v]) => !k.startsWith("_") && !v)
    .map(([k]) => k);
}

/** Carreras del diccionario: [{ clave, nombreCompleto }] (nombreCompleto puede estar vacío). */
export function listarCarreras() {
  return Object.entries(carreras)
    .filter(([k]) => !k.startsWith("_"))
    .map(([clave, nombreCompleto]) => ({ clave, nombreCompleto: nombreCompleto || "" }));
}

/** Año académico vigente, definido en config/sistema.json. */
export function anioAcademico() {
  return Number(sistema.anio_academico) || new Date().getFullYear();
}

/**
 * Contraseña por defecto del Campus para el año vigente.
 * Ejemplo: "Inatec{aa}*" con 2026 -> "Inatec26*".
 */
export function contrasenaPorDefecto() {
  const anio = String(anioAcademico());
  const plantilla = sistema.contrasena_por_defecto || "Inatec{aa}*";
  return plantilla.replace("{aa}", anio.slice(-2)).replace("{anio}", anio);
}

// js/core/fechas.js

/**
 * Fechas de cierre de módulos (config/aulas/*.json -> "fechas_cierre") y cuenta regresiva.
 * Solo aplica a bases TIC y a aulas de tipo módulo; los cursos (Virtual) no tienen reparación.
 */

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function dosDigitos(n) {
  return String(n).padStart(2, "0");
}

/** Convierte "2026-07-21T23:59" en Date local. Devuelve null si está vacío o es inválido. */
export function parsearFechaCierre(texto) {
  if (!texto || typeof texto !== "string") return null;
  const m = texto.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 23), Number(m[5] || 59));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function fechaCierreModulo(configAula, modulo) {
  const texto = configAula?.fechas_cierre?.[modulo];
  return parsearFechaCierre(texto);
}

/** Formato institucional: 21/07/2026 a las 11:59 p. m. */
export function formatearFechaHora(fecha) {
  let horas = fecha.getHours();
  const periodo = horas >= 12 ? "p. m." : "a. m.";
  horas = horas % 12 || 12;
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()} a las ${horas}:${dosDigitos(fecha.getMinutes())} ${periodo}`;
}

export function formatearFechaLarga(fecha) {
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

function plural(n, singular, plurar) {
  return `${n} ${n === 1 ? singular : plurar}`;
}

/**
 * Estado de cierre de un módulo.
 * @returns {{ estado: "sin_fecha"|"abierto"|"vencido", fecha: Date|null,
 *   dias: number, horas: number, minutos: number, texto: string, textoCorto: string }}
 */
export function estadoCierre(configAula, modulo, ahora = new Date()) {
  const fecha = fechaCierreModulo(configAula, modulo);
  if (!fecha) {
    return { estado: "sin_fecha", fecha: null, dias: 0, horas: 0, minutos: 0, texto: "", textoCorto: "" };
  }

  const diferencia = fecha.getTime() - ahora.getTime();
  if (diferencia <= 0) {
    return {
      estado: "vencido",
      fecha,
      dias: 0,
      horas: 0,
      minutos: 0,
      texto: `La fecha de cierre fue el ${formatearFechaLarga(fecha)}. Desde este momento tu docente puede comunicarte que entras en proceso de reparación.`,
      textoCorto: `Cerró el ${formatearFechaHora(fecha)} · proceso de reparación habilitado`,
    };
  }

  const totalMin = Math.floor(diferencia / 60000);
  const dias = Math.floor(totalMin / (60 * 24));
  const horas = Math.floor((totalMin % (60 * 24)) / 60);
  const minutos = totalMin % 60;
  const partes = [plural(dias, "día", "días"), plural(horas, "hora", "horas"), plural(minutos, "minuto", "minutos")];
  const duracion = `${partes[0]}, ${partes[1]} y ${partes[2]}`;

  return {
    estado: "abierto",
    fecha,
    dias,
    horas,
    minutos,
    texto: `Quedan ${duracion} para el cierre de este módulo (${formatearFechaHora(fecha)}).`,
    textoCorto: `Quedan ${duracion} · cierre ${formatearFechaHora(fecha)}`,
  };
}

/**
 * Texto de cierre para documentos (WhatsApp y esquela). Usa las mismas frases
 * que la boleta para que el mensaje sea coherente en todo el sistema.
 * @returns {{ titulo: string, detalle: string, vencido: boolean } | null}
 */
export function textoCierreDocumento(configAula, modulo, ahora = new Date()) {
  const cierre = estadoCierre(configAula, modulo, ahora);
  if (cierre.estado === "sin_fecha") return null;
  if (cierre.estado === "vencido") {
    return {
      vencido: true,
      titulo: `Módulo cerrado el ${formatearFechaHora(cierre.fecha)}`,
      detalle: `Desde este momento tu docente puede comunicarte que entras en proceso de reparación.`,
    };
  }
  const duracion = cierre.texto.match(/Quedan (.+?) para/)?.[1] || "";
  return {
    vencido: false,
    titulo: `Cierre del módulo: ${formatearFechaHora(cierre.fecha)}`,
    detalle: `Quedan ${duracion} para el cierre de este módulo.`,
  };
}

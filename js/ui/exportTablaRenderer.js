/* js/ui/exportTablaRenderer.js */

/**
 * Exporta a Excel la tabla que el docente está viendo (grupo, módulo, filtro y búsqueda),
 * con formato institucional: título, chip del módulo, cuenta regresiva al cierre (solo TIC),
 * semáforo por estado y encabezados fijos con filtros.
 */

import {
  COLOR,
  crearLibro,
  aplicarEstadoCelda,
  escribirEncabezadoReporte,
  estilizarEncabezadoTabla,
  estilizarFilasDatos,
  configurarImpresion,
  descargarLibro,
  fechaArchivo,
  estiloPorEstado,
} from "./excelEstilos.js";
import { formatearFechaHora } from "../core/fechas.js";
import { obtenerComponentesGrupo } from "../core/groupFormat.js";

const APROBADAS = ["APROBADO", "REALIZADO", "CONVALIDADO"];

function estadoGeneral(est, mod) {
  if (est.estadoEstudiante === "retirado") return "RETIRADO";
  if (mod?.estaConvalidado) return "CONVALIDADO";
  if (mod?.completado) return "COMPLETADO";
  return "PENDIENTE";
}

function listarActividades(configAula, moduloNombre) {
  const actividades = [];
  Object.entries(configAula.modulos[moduloNombre] || {}).forEach(([uni, cuestionarios], uIdx) => {
    cuestionarios.forEach((nombreCompleto, i) => {
      actividades.push({
        clave: `U${uIdx + 1}-A${i + 1}`,
        unidad: uni,
        nombreCompleto,
      });
    });
  });
  return actividades;
}

/** Color de avance: verde completo, ámbar en curso, rojo sin iniciar. */
function estiloAvance(porcentaje) {
  if (porcentaje >= 100) return { bg: COLOR.verdeBg, tx: COLOR.verdeTx };
  if (porcentaje > 0) return { bg: COLOR.amarilloBg, tx: COLOR.amarilloTx };
  return { bg: COLOR.rojoBg, tx: COLOR.rojoTx };
}

/**
 * Construye el libro ExcelJS.
 * @param {Object} meta - { filtro, grupo, turno, incluyeRetirados, cierre }
 */
export function construirLibroTabla(estudiantes, moduloNombre, configAula, meta = {}) {
  const libro = crearLibro();
  const ws = libro.addWorksheet("Avance", { properties: { tabColor: { argb: COLOR.primario } } });
  const actividades = listarActividades(configAula, moduloNombre);

  const cabeceras = [
    "Grupo",
    "Carrera",
    "Código",
    "Turno",
    "Estudiante",
    "Correo",
    "Estado",
    "Avance",
    "Cumplidas",
    "Total",
    ...actividades.map((a) => a.clave),
  ];
  const total = cabeceras.length;

  const vista = `${meta.filtro || "Todos los estudiantes"}${meta.incluyeRetirados ? " + retirados" : ""}`;
  const contexto = [
    `Grupo: ${meta.grupo || "Todos los grupos"}`,
    `Turno: ${meta.turno || "—"}`,
    `Vista: ${vista}`,
    `Estudiantes: ${estudiantes.length}`,
    `Generado: ${formatearFechaHora(new Date())}`,
  ].join("   ·   ");

  const cierreTexto = meta.cierre && meta.cierre.estado !== "sin_fecha"
    ? { estado: meta.cierre.estado, texto: meta.cierre.estado === "vencido" ? `⚠ ${meta.cierre.texto}` : `⏳ ${meta.cierre.texto}` }
    : null;

  const filaCab = escribirEncabezadoReporte(ws, {
    titulo: "ANALI-TIC · REPORTE DE AVANCE",
    modulo: moduloNombre,
    contexto,
    cierre: cierreTexto,
    columnas: total,
  });

  // Anchos
  const anchos = [12, 28, 24, 14, 34, 30, 16, 12, 12, 10, ...actividades.map(() => 12)];
  ws.columns = anchos.map((w) => ({ width: w }));

  estilizarEncabezadoTabla(ws, filaCab, cabeceras);

  estudiantes.forEach((est) => {
    const mod = est.modulos ? est.modulos[moduloNombre] : null;
    const grupo = obtenerComponentesGrupo(est.grupoInfo);
    const cuestionarios = [];
    if (mod?.unidades) Object.values(mod.unidades).forEach((lista) => cuestionarios.push(...lista));

    const cumplidas = cuestionarios.filter((c) => APROBADAS.includes(c.estado)).length;
    const totalAct = mod?.totalCuestionarios ?? cuestionarios.length;
    const porcentaje = totalAct > 0 ? cumplidas / totalAct : 0;

    const valoresActividades = actividades.map((_, i) => {
      const c = cuestionarios[i];
      if (est.estadoEstudiante === "retirado") return "RETIRADO";
      if (mod?.estaConvalidado) return "CONVALIDADO";
      if (!c) return "";
      if (c.estado === "APROBADO" || c.estado === "REALIZADO" || c.estado === "REPROBADO") {
        return c.nota !== undefined && c.nota !== null && c.nota !== "" ? Number(c.nota) : c.estado;
      }
      return c.estado;
    });

    const fila = ws.addRow([
      grupo.numeroGrupo,
      grupo.carrera,
      grupo.codigoGrupo,
      est.grupoInfo?.turno || "",
      `${est.nombre} ${est.apellidos}`.trim(),
      est.correo || "",
      estadoGeneral(est, mod),
      porcentaje,
      cumplidas,
      totalAct,
      ...valoresActividades,
    ]);

    fila.getCell(8).numFmt = "0%";
    const avance = estiloAvance(porcentaje * 100);
    fila.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: avance.bg } };
    fila.getCell(8).font = { bold: true, color: { argb: avance.tx } };
    fila.getCell(8).alignment = { horizontal: "center", vertical: "middle" };

    aplicarEstadoCelda(fila.getCell(7), fila.getCell(7).value);
    fila.getCell(7).alignment = { horizontal: "center", vertical: "middle" };

    actividades.forEach((_, i) => {
      const celda = fila.getCell(11 + i);
      celda.alignment = { horizontal: "center", vertical: "middle" };
      const valor = celda.value;
      if (typeof valor === "number") {
        const nota = valor;
        const estilo = nota >= 60 ? estiloPorEstado("APROBADO") : estiloPorEstado("REPROBADO");
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: estilo.bg } };
        celda.font = { bold: true, color: { argb: estilo.tx } };
      } else {
        aplicarEstadoCelda(celda, valor);
      }
    });

  });

  const ultimaFila = filaCab + estudiantes.length;
  estilizarFilasDatos(ws, filaCab + 1, ultimaFila, total);

  ws.autoFilter = { from: { row: filaCab, column: 1 }, to: { row: Math.max(ultimaFila, filaCab), column: total } };
  configurarImpresion(ws, filaCab);

  // Hoja de referencia con el nombre completo de cada actividad
  const ref = libro.addWorksheet("Referencia actividades");
  ref.mergeCells(1, 1, 1, 3);
  const titulo = ref.getCell(1, 1);
  titulo.value = `Actividades de ${moduloNombre}`;
  titulo.font = { bold: true, size: 14, color: { argb: COLOR.blanco } };
  titulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.primario } };
  titulo.alignment = { vertical: "middle", indent: 1 };
  ref.getRow(1).height = 30;
  estilizarEncabezadoTabla(ref, 2, ["Clave", "Unidad", "Actividad (nombre completo)"]);
  actividades.forEach((a, i) => {
    const fila = ref.addRow([a.clave, a.unidad, a.nombreCompleto]);
    fila.getCell(1).font = { bold: true, color: { argb: COLOR.primarioOscuro } };
    fila.getCell(1).alignment = { horizontal: "center" };
    if (i % 2 === 1) fila.eachCell((c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.grisClaro } }));
  });
  ref.columns = [{ width: 12 }, { width: 16 }, { width: 100 }];
  ref.views = [{ state: "frozen", ySplit: 2 }];

  return libro;
}

/**
 * Descarga el archivo: Avance_<módulo>_<grupo>_<fecha>.xlsx
 */
export async function exportarTablaExcel(estudiantes, moduloNombre, configAula, meta = {}) {
  if (typeof ExcelJS === "undefined") {
    alert("No se pudo cargar ExcelJS para exportar.");
    return;
  }
  if (!estudiantes || estudiantes.length === 0) {
    alert("No hay estudiantes en la vista actual para exportar.");
    return;
  }

  const libro = construirLibroTabla(estudiantes, moduloNombre, configAula, meta);
  const limpiar = (t) => String(t).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  const nombre = `Avance_${limpiar(moduloNombre)}_${limpiar(meta.grupo || "Todos")}_${fechaArchivo()}.xlsx`;
  await descargarLibro(libro, nombre);
}

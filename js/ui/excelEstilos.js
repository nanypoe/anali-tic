/* js/ui/excelEstilos.js */

/**
 * Estilos compartidos para los Excel de Anali-TIC (ExcelJS).
 * Paleta de marca: violeta principal, amarillo de acento, y semáforo de estados.
 */

export const COLOR = {
  primario: "FF5B3DF5",
  primarioOscuro: "FF3E24C7",
  primarioClaro: "FFEEEAFE",
  acento: "FFFFB703",
  tinta: "FF1E1B3A",
  gris: "FF6B7280",
  grisClaro: "FFF3F4F6",
  borde: "FFD9D4F7",
  verdeBg: "FFD1FAE5",
  verdeTx: "FF065F46",
  amarilloBg: "FFFFF3C4",
  amarilloTx: "FF7C4A00",
  rojoBg: "FFFFD9D5",
  rojoTx: "FFB42318",
  convBg: "FFDDD6FE",
  convTx: "FF4C1D95",
  retiradoBg: "FFE5E7EB",
  retiradoTx: "FF4B5563",
  blanco: "FFFFFFFF",
};

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function crearLibro(creador = "Anali-TIC") {
  const libro = new ExcelJS.Workbook();
  libro.creator = creador;
  libro.created = new Date();
  return libro;
}

const relleno = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const bordeFino = (argb = COLOR.borde) => {
  const lado = { style: "thin", color: { argb } };
  return { top: lado, left: lado, bottom: lado, right: lado };
};

/** Estilos por estado (texto o nota). Devuelve { fill, font } o null. */
export function estiloPorEstado(valor) {
  const v = String(valor ?? "").toUpperCase();
  if (["APROBADO", "REALIZADO", "COMPLETADO"].includes(v)) return { bg: COLOR.verdeBg, tx: COLOR.verdeTx };
  if (["PENDIENTE", "EN PROGRESO"].includes(v)) return { bg: COLOR.amarilloBg, tx: COLOR.amarilloTx };
  if (["REPROBADO", "PENDIENTE VENCIDO"].includes(v)) return { bg: COLOR.rojoBg, tx: COLOR.rojoTx };
  if (["CONVALIDADO"].includes(v)) return { bg: COLOR.convBg, tx: COLOR.convTx };
  if (["RETIRADO"].includes(v)) return { bg: COLOR.retiradoBg, tx: COLOR.retiradoTx };
  return null;
}

export function aplicarEstadoCelda(celda, valor) {
  const estilo = estiloPorEstado(valor);
  if (!estilo) return;
  celda.fill = relleno(estilo.bg);
  celda.font = { bold: true, color: { argb: estilo.tx } };
}

/**
 * Bloque superior: título, chip del módulo, línea de contexto y línea de cierre.
 * @returns {number} fila donde debe ir el encabezado de la tabla (con una fila de aire).
 */
export function escribirEncabezadoReporte(ws, { titulo, modulo, contexto, cierre, columnas }) {
  const ultima = Math.max(columnas, 4);

  ws.mergeCells(1, 1, 1, ultima);
  const t = ws.getCell(1, 1);
  t.value = titulo;
  t.font = { name: "Calibri", size: 16, bold: true, color: { argb: COLOR.blanco } };
  t.fill = relleno(COLOR.primario);
  t.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(1).height = 34;

  ws.mergeCells(2, 1, 2, ultima);
  const m = ws.getCell(2, 1);
  m.value = `MÓDULO / CURSO:  ${modulo.toUpperCase()}`;
  m.font = { name: "Calibri", size: 14, bold: true, color: { argb: COLOR.tinta } };
  m.fill = relleno(COLOR.acento);
  m.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(2).height = 28;

  ws.mergeCells(3, 1, 3, ultima);
  const c = ws.getCell(3, 1);
  c.value = contexto;
  c.font = { name: "Calibri", size: 10, color: { argb: COLOR.gris } };
  c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(3).height = 20;

  if (cierre) {
    ws.mergeCells(4, 1, 4, ultima);
    const cc = ws.getCell(4, 1);
    cc.value = cierre.texto;
    const vencido = cierre.estado === "vencido";
    cc.font = { name: "Calibri", size: 11, bold: true, color: { argb: vencido ? COLOR.rojoTx : COLOR.amarilloTx } };
    cc.fill = relleno(vencido ? COLOR.rojoBg : COLOR.amarilloBg);
    cc.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
    ws.getRow(4).height = 24;
  }

  return cierre ? 6 : 5;
}

export function estilizarEncabezadoTabla(ws, fila, cabeceras) {
  const fila_ = ws.getRow(fila);
  fila_.values = cabeceras;
  fila_.height = 30;
  fila_.eachCell((celda) => {
    celda.font = { name: "Calibri", bold: true, color: { argb: COLOR.blanco }, size: 11 };
    celda.fill = relleno(COLOR.primarioOscuro);
    celda.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    celda.border = bordeFino(COLOR.primarioOscuro);
  });
}

/** Aplica bandas, bordes y alineación a las filas de datos. */
export function estilizarFilasDatos(ws, filaInicio, filaFin, totalColumnas) {
  for (let r = filaInicio; r <= filaFin; r++) {
    const fila = ws.getRow(r);
    fila.height = 22;
    const banda = (r - filaInicio) % 2 === 1;
    for (let c = 1; c <= totalColumnas; c++) {
      const celda = fila.getCell(c);
      celda.border = bordeFino();
      celda.alignment = { vertical: "middle", horizontal: c === 1 ? "center" : "left", wrapText: false, ...(celda.alignment || {}) };
      if (banda && !celda.fill?.fgColor) celda.fill = relleno(COLOR.grisClaro);
    }
  }
}

export function configurarImpresion(ws, filaEncabezado) {
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: filaEncabezado, activeCell: `A${filaEncabezado + 1}` }];
  ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}

export async function descargarLibro(libro, nombre) {
  const buffer = await libro.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: MIME_XLSX });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function fechaArchivo() {
  const hoy = new Date();
  return `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}`;
}

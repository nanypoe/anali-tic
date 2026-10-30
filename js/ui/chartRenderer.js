/* js/ui/chartRenderer.js */

import { getTipoBase } from "../core/store.js";
import { COLOR_TEXTO_GRAFICO } from "./tema.js";
import { animacionesReducidas } from "../core/preferencias.js";
import { estadoCierre, formatearFechaHora } from "../core/fechas.js";
import {
  formatearEtiquetaGrupo,
  obtenerComponentesGrupo,
} from "../core/groupFormat.js";
import {
  COLOR,
  crearLibro,
  escribirEncabezadoReporte,
  estilizarEncabezadoTabla,
  estilizarFilasDatos,
  configurarImpresion,
  descargarLibro,
  fechaArchivo,
} from "./excelEstilos.js";

/** Instancia global de Chart.js para re-renderizado sin fugas de memoria. */
let miChart = null;

const COLORES_DONA = {
  completados: "#10B981",
  enProgreso: "#FFB703",
  sinIniciar: "#FF6B5B",
  retirados: "#94A3B8",
};

function escaparHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[caracter]);
}

/** Clasifica cada estudiante para el módulo indicado. */
function clasificar(est, moduloNombre) {
  if (est.estadoEstudiante === "retirado") return "retirado";
  const mod = est.modulos ? est.modulos[moduloNombre] : null;
  if (!mod) return "sinIniciar";
  if (mod.completado || mod.estaConvalidado || (mod.porcentajeAvance || 0) === 100) return "completado";
  if ((mod.porcentajeAvance || 0) > 0) return "enProgreso";
  return "sinIniciar";
}

/** Totales generales y por grupo. */
export function calcularMetricas(datosEstudiantes, moduloNombre) {
  const total = { total: 0, completados: 0, enProgreso: 0, sinIniciar: 0, retirados: 0 };
  const grupos = new Map();

  datosEstudiantes.forEach((est) => {
    const grupoInfo = est.grupoInfo || {};
    const clave = grupoInfo.etiquetaGrupo || "SIN GRUPO";
    if (!grupos.has(clave)) {
      const componentes = obtenerComponentesGrupo(grupoInfo);
      grupos.set(clave, {
        etiqueta: clave,
        etiquetaEstandar: formatearEtiquetaGrupo(grupoInfo),
        numeroGrupo: componentes.numeroGrupo,
        carrera: componentes.carrera,
        codigo: componentes.codigoGrupo,
        total: 0, completados: 0, enProgreso: 0, sinIniciar: 0, retirados: 0,
      });
    }
    const g = grupos.get(clave);
    const categoria = clasificar(est, moduloNombre);
    total.total++;
    g.total++;
    if (categoria === "completado") { total.completados++; g.completados++; }
    else if (categoria === "enProgreso") { total.enProgreso++; g.enProgreso++; }
    else if (categoria === "retirado") { total.retirados++; g.retirados++; }
    else { total.sinIniciar++; g.sinIniciar++; }
  });

  const listaGrupos = Array.from(grupos.values()).sort((a, b) =>
    a.etiquetaEstandar.localeCompare(b.etiquetaEstandar, "es", {
      numeric: true,
      sensitivity: "base",
    }),
  );
  return { total, grupos: listaGrupos };
}

const pct = (parte, todo) => (todo > 0 ? ((parte / todo) * 100).toFixed(1) : "0.0");

/** Tarjetas de indicadores con números animados. */
function renderizarKpis(m, moduloNombre, configAula) {
  const contenedor = document.getElementById("metricas-kpis");
  if (!contenedor) return;
  const evaluados = m.total.total - m.total.retirados;

  const tarjetas = [
    { icono: "bi-people-fill", color: "primario", titulo: "Estudiantes", valor: m.total.total, sub: `${m.total.retirados} retirado(s) fuera del cálculo` },
    { icono: "bi-check2-circle", color: "verde", titulo: "Completados", valor: m.total.completados, sub: `${pct(m.total.completados, evaluados)}% de los activos (incluye convalidados)` },
    { icono: "bi-hourglass-split", color: "ambar", titulo: "En progreso", valor: m.total.enProgreso, sub: "Han entregado algo, aún no completan" },
    { icono: "bi-exclamation-octagon-fill", color: "coral", titulo: "Sin iniciar", valor: m.total.sinIniciar, sub: `${pct(m.total.sinIniciar, evaluados)}% de los activos` },
  ];

  const cierre = getTipoBase() === "tic" ? estadoCierre(configAula, moduloNombre) : null;
  const tarjetaCierre = cierre && cierre.estado !== "sin_fecha"
    ? `<div class="kpi-card kpi-cierre kpi-${cierre.estado}">
         <div class="kpi-icono"><i class="bi ${cierre.estado === "vencido" ? "bi-lock-fill" : "bi-alarm-fill"}"></i></div>
         <div class="kpi-texto">
           <div class="kpi-titulo">Cierre del módulo</div>
           <div class="kpi-sub">${cierre.estado === "vencido" ? `Cerró el ${formatearFechaHora(cierre.fecha)}` : cierre.textoCorto}</div>
         </div>
       </div>`
    : "";

  contenedor.innerHTML = tarjetas
    .map((t, i) => `
      <div class="kpi-card kpi-${t.color}" style="animation-delay:${i * 80}ms">
        <div class="kpi-icono"><i class="bi ${t.icono}"></i></div>
        <div class="kpi-texto">
          <div class="kpi-titulo">${t.titulo}</div>
          <div class="kpi-valor" data-valor="${t.valor}">0</div>
          <div class="kpi-sub">${t.sub}</div>
        </div>
      </div>`)
    .join("") + tarjetaCierre;

  contenedor.querySelectorAll(".kpi-valor").forEach((el) => animarNumero(el, Number(el.dataset.valor)));
}

function animarNumero(el, destino, duracion = 700) {
  if (animacionesReducidas()) {
    el.textContent = destino;
    return;
  }
  const inicio = performance.now();
  const paso = (ahora) => {
    const t = Math.min(1, (ahora - inicio) / duracion);
    el.textContent = Math.round(destino * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/** Gráfico de dona con leyenda explicativa. */
export function renderizarGraficoDona(datosEstudiantes = [], moduloNombre = "") {
  const canvas = document.getElementById("chartEstadoEstudiantes");
  if (!canvas || typeof Chart === "undefined") return;

  if (miChart) {
    miChart.destroy();
    miChart = null;
  }

  const m = calcularMetricas(datosEstudiantes, moduloNombre).total;
  const valores = [m.completados, m.enProgreso, m.sinIniciar, m.retirados];
  const etiquetas = ["Completados", "En progreso", "Sin iniciar", "Retirados"];
  const colores = [COLORES_DONA.completados, COLORES_DONA.enProgreso, COLORES_DONA.sinIniciar, COLORES_DONA.retirados];
  const totalEvaluados = m.total;

  miChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: etiquetas,
      datasets: [{ data: valores, backgroundColor: colores, borderColor: "#ffffff", borderWidth: 3, hoverOffset: 10 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      animation: animacionesReducidas() ? false : { animateRotate: true, duration: 900 },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 12, family: 'system-ui, -apple-system, "Segoe UI", Roboto', weight: "600" },
            padding: 14,
            usePointStyle: true,
            pointStyle: "circle",
            generateLabels: (chart) =>
              etiquetas.map((label, i) => ({
                text: `${label}: ${valores[i]} (${pct(valores[i], totalEvaluados)}%)`,
                fillStyle: colores[i],
                strokeStyle: "#ffffff",
                hidden: false,
                index: i,
              })),
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} estudiante(s) (${pct(ctx.raw, totalEvaluados)}%)`,
          },
        },
      },
    },
  });

  const btn = document.getElementById("btn-descargar-grafico-png");
  if (btn) btn.onclick = () => descargarGraficoComoImagen(moduloNombre, totalEvaluados);
}

/** PNG del gráfico con encabezado de marca. */
function descargarGraficoComoImagen(moduloNombre, total) {
  const canvas = document.getElementById("chartEstadoEstudiantes");
  if (!canvas) return;

  const ancho = canvas.width + 80;
  const alto = canvas.height + 150;
  const temp = document.createElement("canvas");
  temp.width = ancho;
  temp.height = alto;
  const ctx = temp.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ancho, alto);
  ctx.fillStyle = "#5B3DF5";
  ctx.fillRect(0, 0, ancho, 62);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ANALI-TIC · DISTRIBUCIÓN DEL AULA", 24, 38);

  ctx.fillStyle = "#FFB703";
  const textoModulo = `MÓDULO / CURSO: ${moduloNombre.toUpperCase()}`;
  ctx.font = "bold 15px system-ui, sans-serif";
  const anchoTexto = ctx.measureText(textoModulo).width;
  ctx.fillRect(24, 76, anchoTexto + 24, 30);
  ctx.fillStyle = "#1E1B3A";
  ctx.fillText(textoModulo, 36, 97);

  ctx.fillStyle = "#6B7280";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText(`Total evaluados: ${total} estudiantes (retirados fuera del porcentaje)`, 24, 128);

  // La leyenda se dibuja con el color del tema claro para que se lea sobre el fondo blanco del PNG
  const colorLeyenda = miChart?.options.plugins.legend.labels.color;
  if (miChart) {
    miChart.options.plugins.legend.labels.color = COLOR_TEXTO_GRAFICO.claro;
    miChart.update("none");
  }
  ctx.drawImage(canvas, 40, 140);
  if (miChart) {
    miChart.options.plugins.legend.labels.color = colorLeyenda;
    miChart.update("none");
  }

  const enlace = document.createElement("a");
  enlace.download = `Distribucion_${moduloNombre.replace(/[^\wÁÉÍÓÚÑáéíóúñ-]+/g, "_")}_${fechaArchivo()}.png`;
  enlace.href = temp.toDataURL("image/png");
  enlace.click();
}

/** Tabla por grupo con barras de progreso. */
export function renderizarTablaComparativaGrupos(datosEstudiantes = [], moduloNombre = "") {
  const container = document.getElementById("tabla-resumen-grupos-container");
  if (!container) return;

  const { total, grupos } = calcularMetricas(datosEstudiantes, moduloNombre);
  if (grupos.length === 0) {
    container.innerHTML = `<div class="alert alert-info text-center py-3">No hay datos de grupos disponibles.</div>`;
    return;
  }

  const barra = (valor, color) => `
    <div class="barra-pct" title="${valor}%">
      <div class="barra-pct-fill" style="width:${valor}%;background:${color}"></div>
      <span>${valor}%</span>
    </div>`;

  const filas = grupos.map((g) => {
    const evaluados = g.total - g.retirados;
    const comp = g.completados;
    const pend = evaluados - comp;
    const pComp = pct(comp, evaluados);
    const pPend = pct(pend, evaluados);
    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <span class="fw-semibold">${escaparHtml(g.etiquetaEstandar)}</span>
          </div>
        </td>
        <td class="text-center fw-bold">${g.total}</td>
        <td class="text-center fw-bold text-success">${comp}</td>
        <td style="min-width: 150px">${barra(pComp, COLORES_DONA.completados)}</td>
        <td class="text-center fw-bold" style="color:#B45309">${pend}</td>
        <td style="min-width: 150px">${barra(pPend, COLORES_DONA.enProgreso)}</td>
        <td class="text-center text-muted">${g.retirados}</td>
      </tr>`;
  }).join("");

  const evaluadosTotal = total.total - total.retirados;
  container.innerHTML = `
    <table class="table table-hover align-middle mb-0 tabla-grupos">
      <thead>
        <tr>
          <th>Grupo y carrera</th>
          <th class="text-center">Total</th>
          <th class="text-center">Completados</th>
          <th>% completado</th>
          <th class="text-center">Pendientes</th>
          <th>% pendiente</th>
          <th class="text-center">Retirados</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr>
          <td class="fw-bold">TOTAL DEL AULA</td>
          <td class="text-center fw-bold">${total.total}</td>
          <td class="text-center fw-bold text-success">${total.completados}</td>
          <td>${barra(pct(total.completados, evaluadosTotal), COLORES_DONA.completados)}</td>
          <td class="text-center fw-bold" style="color:#B45309">${evaluadosTotal - total.completados}</td>
          <td>${barra(pct(evaluadosTotal - total.completados, evaluadosTotal), COLORES_DONA.enProgreso)}</td>
          <td class="text-center text-muted">${total.retirados}</td>
        </tr>
      </tfoot>
    </table>
    <p class="small text-muted mt-2 mb-0">
      <i class="bi bi-info-circle me-1"></i>Los porcentajes se calculan sobre estudiantes activos. Los convalidados cuentan como completados y los retirados no entran al cálculo.
    </p>`;
}

/** Excel del resumen por grupo con el mismo formato institucional. */
export async function exportarResumenGruposExcel(datosEstudiantes = [], moduloNombre = "", configAula = null) {
  if (typeof ExcelJS === "undefined") {
    alert("Error: La librería ExcelJS no está disponible.");
    return;
  }

  const { total, grupos } = calcularMetricas(datosEstudiantes, moduloNombre);
  const libro = crearLibro();
  const ws = libro.addWorksheet("Resumen por grupos", { properties: { tabColor: { argb: COLOR.acento } } });

  const cabeceras = ["Grupo", "Carrera", "Código", "Total", "Completados", "% completados", "Pendientes", "% pendientes", "Retirados"];
  const cierre = getTipoBase() === "tic" ? estadoCierre(configAula, moduloNombre) : null;
  const filaCab = escribirEncabezadoReporte(ws, {
    titulo: "ANALI-TIC · RESUMEN POR GRUPOS",
    modulo: moduloNombre,
    contexto: `Generado: ${formatearFechaHora(new Date())}   ·   Porcentajes sobre estudiantes activos`,
    cierre: cierre && cierre.estado !== "sin_fecha"
      ? { estado: cierre.estado, texto: cierre.estado === "vencido" ? `⚠ ${cierre.texto}` : `⏳ ${cierre.texto}` }
      : null,
    columnas: cabeceras.length,
  });
  ws.columns = [12, 28, 24, 10, 14, 15, 13, 15, 12].map((w) => ({ width: w }));
  estilizarEncabezadoTabla(ws, filaCab, cabeceras);

  const filasDatos = grupos.map((g) => {
    const evaluados = g.total - g.retirados;
    const pComp = evaluados > 0 ? g.completados / evaluados : 0;
    const pPend = evaluados > 0 ? (evaluados - g.completados) / evaluados : 0;
    return [
      g.numeroGrupo,
      g.carrera,
      g.codigo,
      g.total,
      g.completados,
      pComp,
      evaluados - g.completados,
      pPend,
      g.retirados,
    ];
  });
  const evaluadosTotal = total.total - total.retirados;
  filasDatos.forEach((f) => ws.addRow(f));
  const filaTotal = ws.addRow([
    "",
    "Total del aula",
    "",
    total.total,
    total.completados,
    evaluadosTotal > 0 ? total.completados / evaluadosTotal : 0,
    evaluadosTotal - total.completados,
    evaluadosTotal > 0 ? (evaluadosTotal - total.completados) / evaluadosTotal : 0,
    total.retirados,
  ]);

  const ultima = filaCab + filasDatos.length;
  estilizarFilasDatos(ws, filaCab + 1, ultima + 1, cabeceras.length);
  [6, 8].forEach((col) => {
    for (let r = filaCab + 1; r <= ultima + 1; r++) ws.getRow(r).getCell(col).numFmt = "0.0%";
  });
  filaTotal.eachCell((c) => {
    c.font = { bold: true, color: { argb: COLOR.primarioOscuro } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR.primarioClaro } };
  });
  ws.getRow(filaCab + 1).getCell(5).font = { bold: true, color: { argb: "FF065F46" } };
  configurarImpresion(ws, filaCab);

  const modClean = moduloNombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  await descargarLibro(libro, `AnaliTIC_Resumen_Grupos_${modClean}_${fechaArchivo()}.xlsx`);
}

/** Modal "Análisis del aula": indicadores, distribución y tabla por grupo. */
export function mostrarModalMetricasAula(datosEstudiantes, moduloNombreActual, configAula) {
  const modalEl = document.getElementById("modalMetricasAula");
  if (!modalEl) return;

  let moduloSeleccionado = moduloNombreActual;

  const selector = document.getElementById("modal-modulo-selector");
  if (selector && configAula?.modulos) {
    selector.innerHTML = Object.keys(configAula.modulos)
      .map((mod) => `<option value="${mod}" ${mod === moduloSeleccionado ? "selected" : ""}>${mod}</option>`)
      .join("");
    selector.onchange = (e) => {
      moduloSeleccionado = e.target.value;
      renderizarTodo();
    };
  }

  const renderizarTodo = () => {
    renderizarKpis(calcularMetricas(datosEstudiantes, moduloSeleccionado), moduloSeleccionado, configAula);
    renderizarGraficoDona(datosEstudiantes, moduloSeleccionado);
    renderizarTablaComparativaGrupos(datosEstudiantes, moduloSeleccionado);
    const tituloModulo = document.getElementById("metricas-modulo");
    if (tituloModulo) tituloModulo.textContent = moduloSeleccionado;
  };

  // Se pinta ya visible: así la dona y los indicadores animan a la vista del usuario
  modalEl.addEventListener("shown.bs.modal", renderizarTodo, { once: true });

  const btnExcel = document.getElementById("btn-exportar-resumen-excel");
  if (btnExcel) btnExcel.onclick = () => exportarResumenGruposExcel(datosEstudiantes, moduloSeleccionado, configAula);

  const tabGeneral = document.getElementById("pills-general-tab");
  if (tabGeneral && !tabGeneral.dataset.vinculado) {
    tabGeneral.dataset.vinculado = "1";
    tabGeneral.addEventListener("shown.bs.tab", () => miChart && miChart.resize());
  }

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

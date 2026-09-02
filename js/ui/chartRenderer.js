/* js/ui/chartRenderer.js */

/**
 * Instancia global de Chart.js para re-renderizado sin fugas de memoria.
 */
let miChart = null;

/**
 * Diccionario de equivalencias para formatear nombres de carrera a texto completo y legible.
 */
const MAPA_CARRERAS = {
  contabilidad: "CONTABILIDAD",
  administracion: "ADMINISTRACION",
  administración: "ADMINISTRACION",
  computacion: "COMPUTACION",
  computación: "COMPUTACION",
  aduana: "GESTION ADUANERA",
  pasteleria: "PASTELERIA Y PANADERIA",
  pastelería: "PASTELERIA Y PANADERIA",
  banca: "BANCA Y FINANZAS",
  ingles: "INGLES",
  inglés: "INGLES",
  programacion: "PROGRAMACION",
  programación: "PROGRAMACION",
  zootecnia: "ZOOTECNIA",
  agronomia: "AGRONOMIA",
  agronomía: "AGRONOMIA",
};

/**
 * Formatea el nombre de la carrera según el mapa o en mayúsculas por defecto.
 */
function formatearNombreCarrera(carreraRaw = "") {
  if (!carreraRaw || carreraRaw.trim() === "") return "CARRERA GENERAL";
  const limpia = carreraRaw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  return MAPA_CARRERAS[limpia] || carreraRaw.toUpperCase().trim();
}

/**
 * Renderiza el gráfico de dona con métricas visibles.
 */
export function renderizarGraficoDona(datosEstudiantes = [], moduloNombre = "") {
  const canvas = document.getElementById("chartEstadoEstudiantes");
  if (!canvas) return;

  if (miChart) {
    miChart.destroy();
    miChart = null;
  }

  if (typeof Chart === "undefined") {
    console.error("Chart.js no está disponible.");
    return;
  }

  let completados = 0;
  let enProgreso = 0;
  let sinIniciar = 0;
  let retirados = 0;

  datosEstudiantes.forEach((est) => {
    if (est.estadoEstudiante === "retirado") {
      retirados++;
      return;
    }

    const mod = est.modulos ? est.modulos[moduloNombre] : null;
    if (!mod) {
      sinIniciar++;
      return;
    }

    const pct = mod.porcentajeAvance || 0;
    const convalidado = mod.estaConvalidado || false;
    const completado = mod.completado || false;

    if (completado || convalidado || pct === 100) {
      completados++;
    } else if (pct > 0) {
      enProgreso++;
    } else {
      sinIniciar++;
    }
  });

  const totalEvaluados = completados + enProgreso + sinIniciar + retirados;

  const ctx = canvas.getContext("2d");
  miChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Completados 🟢", "En Progreso 🟡", "Sin Iniciar 🟠", "Retirados ⚪"],
      datasets: [
        {
          data: [completados, enProgreso, sinIniciar, retirados],
          backgroundColor: ["#198754", "#ffc107", "#fd7e14", "#6c757d"],
          hoverBackgroundColor: ["#157347", "#ffcd39", "#e06c10", "#5c636a"],
          borderColor: ["#ffffff", "#ffffff", "#ffffff", "#ffffff"],
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 12, family: 'system-ui, -apple-system, "Segoe UI", Roboto' },
            padding: 16,
            usePointStyle: true,
            generateLabels: (chart) => {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const val = data.datasets[0].data[i];
                  const pct = totalEvaluados > 0 ? ((val / totalEvaluados) * 100).toFixed(1) : "0.0";
                  return {
                    text: `${label}: ${val} (${pct}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: "#ffffff",
                    lineWidth: 1,
                    hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                    index: i,
                  };
                });
              }
              return [];
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const valor = context.raw || 0;
              const porcentaje = totalEvaluados > 0 
                ? ((valor / totalEvaluados) * 100).toFixed(1) 
                : "0.0";
              return ` ${context.label}: ${valor} estudiante(s) (${porcentaje}%)`;
            },
          },
        },
      },
    },
  });

  // Configurar botón de descarga de imagen
  const btnDescargarGrafico = document.getElementById("btn-descargar-grafico-png");
  if (btnDescargarGrafico) {
    btnDescargarGrafico.onclick = () => descargarGraficoComoImagen(moduloNombre, totalEvaluados, [completados, enProgreso, sinIniciar, retirados]);
  }
}

/**
 * Exporta el gráfico en formato PNG con marcas de texto numéricas.
 */
function descargarGraficoComoImagen(moduloNombre, total, datos) {
  const canvas = document.getElementById("chartEstadoEstudiantes");
  if (!canvas) return;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = canvas.width + 80;
  tempCanvas.height = canvas.height + 140;

  // Fondo blanco
  tempCtx.fillStyle = "#ffffff";
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Encabezado
  tempCtx.fillStyle = "#0d6efd";
  tempCtx.font = "bold 18px system-ui, sans-serif";
  tempCtx.textAlign = "center";
  tempCtx.fillText(`ANÁLISIS GENERAL DE AULA - MÓDULO: ${moduloNombre.toUpperCase()}`, tempCanvas.width / 2, 35);

  tempCtx.fillStyle = "#6c757d";
  tempCtx.font = "13px system-ui, sans-serif";
  tempCtx.fillText(`Total Evaluados: ${total} estudiantes`, tempCanvas.width / 2, 58);

  // Dibujar gráfico
  tempCtx.drawImage(canvas, 40, 70);

  // Descargar PNG
  const link = document.createElement("a");
  const hoy = new Date();
  const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  link.download = `Grafico_Distribucion_${moduloNombre}_${fechaStr}.png`;
  link.href = tempCanvas.toDataURL("image/png");
  link.click();
}

/**
 * Renderiza la matriz comparativa por grupos agrupados y ordenados.
 */
export function renderizarTablaComparativaGrupos(datosEstudiantes = [], moduloNombre = "") {
  const container = document.getElementById("tabla-resumen-grupos-container");
  if (!container) return;

  const gruposMap = {};

  datosEstudiantes.forEach((est) => {
    const etiquetaGrupo = est.grupoInfo?.etiquetaGrupo || "SIN GRUPO";
    const carreraRaw = est.grupoInfo?.carrera || "Carrera General";
    const grupoCod = est.grupoInfo?.grupo || est.grupoInfo?.codigo || "G-00";

    if (!gruposMap[etiquetaGrupo]) {
      gruposMap[etiquetaGrupo] = {
        carreraFormateada: formatearNombreCarrera(carreraRaw),
        grupoCodigo: grupoCod,
        etiqueta: etiquetaGrupo,
        total: 0,
        completados: 0,
        pendientes: 0,
        retirados: 0,
      };
    }

    const g = gruposMap[etiquetaGrupo];
    g.total++;

    if (est.estadoEstudiante === "retirado") {
      g.retirados++;
      return;
    }

    const mod = est.modulos ? est.modulos[moduloNombre] : null;
    const pct = mod?.porcentajeAvance || 0;
    const convalidado = mod?.estaConvalidado || false;
    const completado = mod?.completado || false;

    if (completado || convalidado || pct === 100) {
      g.completados++;
    } else {
      g.pendientes++;
    }
  });

  // Ordenar numéricamente por número de grupo (G01, G02, G03...)
  const listaGrupos = Object.values(gruposMap).sort((a, b) => {
    return a.grupoCodigo.localeCompare(b.grupoCodigo, undefined, { numeric: true, sensitivity: "base" }) ||
           a.carreraFormateada.localeCompare(b.carreraFormateada, undefined, { sensitivity: "base" });
  });

  if (listaGrupos.length === 0) {
    container.innerHTML = `<div class="alert alert-info text-center py-3">No hay datos de grupos disponibles.</div>`;
    return;
  }

  let sumTotal = 0;
  let sumCompletados = 0;
  let sumPendientes = 0;
  let sumRetirados = 0;

  const filasHTML = listaGrupos
    .map((g) => {
      sumTotal += g.total;
      sumCompletados += g.completados;
      sumPendientes += g.pendientes;
      sumRetirados += g.retirados;

      const evalSinRetirados = g.completados + g.pendientes;
      const pctComp = evalSinRetirados > 0 ? ((g.completados / evalSinRetirados) * 100).toFixed(1) : "0.0";
      const pctPend = evalSinRetirados > 0 ? ((g.pendientes / evalSinRetirados) * 100).toFixed(1) : "0.0";

      return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-primary fs-6 px-2 py-1 shadow-sm">${g.grupoCodigo}</span>
              <span class="fw-bold text-dark fs-6">${g.carreraFormateada}</span>
            </div>
          </td>
          <td class="text-center fw-bold fs-6">${g.total}</td>
          <td class="text-center text-success fw-bold fs-6">${g.completados}</td>
          <td class="text-center" style="min-width: 130px;">
            <div class="progress" style="height: 20px;">
              <div class="progress-bar bg-success fw-bold fs-7" role="progressbar" style="width: ${pctComp}%;" aria-valuenow="${pctComp}" aria-valuemin="0" aria-valuemax="100">${pctComp}%</div>
            </div>
          </td>
          <td class="text-center text-warning fw-bold fs-6">${g.pendientes}</td>
          <td class="text-center" style="min-width: 130px;">
            <div class="progress" style="height: 20px;">
              <div class="progress-bar bg-warning text-dark fw-bold fs-7" role="progressbar" style="width: ${pctPend}%;" aria-valuenow="${pctPend}" aria-valuemin="0" aria-valuemax="100">${pctPend}%</div>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const evalTotalAula = sumCompletados + sumPendientes;
  const pctCompTotal = evalTotalAula > 0 ? ((sumCompletados / evalTotalAula) * 100).toFixed(1) : "0.0";
  const pctPendTotal = evalTotalAula > 0 ? ((sumPendientes / evalTotalAula) * 100).toFixed(1) : "0.0";

  container.innerHTML = `
    <table class="table table-hover align-middle border mb-0">
      <thead class="table-light">
        <tr>
          <th>Grupo y Carrera</th>
          <th class="text-center">Total</th>
          <th class="text-center">Completados 🟢</th>
          <th class="text-center">% Completado</th>
          <th class="text-center">Pendientes ⚠️</th>
          <th class="text-center">% Pendiente</th>
        </tr>
      </thead>
      <tbody>
        ${filasHTML}
      </tbody>
      <tfoot class="table-secondary fw-bold">
        <tr>
          <td>TOTAL ACUMULADO AULA</td>
          <td class="text-center">${sumTotal}</td>
          <td class="text-center text-success">${sumCompletados}</td>
          <td class="text-center">${pctCompTotal}%</td>
          <td class="text-center text-dark">${sumPendientes}</td>
          <td class="text-center">${pctPendTotal}%</td>
        </tr>
      </tfoot>
    </table>
  `;
}

/**
 * Exporta la tabla resumen a Excel (.xlsx) con nombres ordenados y formateados.
 */
export function exportarResumenGruposExcel(datosEstudiantes = [], moduloNombre = "") {
  if (typeof XLSX === "undefined") {
    alert("Error: La librería SheetJS no está disponible.");
    return;
  }

  const gruposMap = {};

  datosEstudiantes.forEach((est) => {
    const etiquetaGrupo = est.grupoInfo?.etiquetaGrupo || "SIN GRUPO";
    const carreraRaw = est.grupoInfo?.carrera || "Carrera General";
    const grupoCod = est.grupoInfo?.grupo || est.grupoInfo?.codigo || "G-00";

    if (!gruposMap[etiquetaGrupo]) {
      gruposMap[etiquetaGrupo] = {
        carreraFormateada: formatearNombreCarrera(carreraRaw),
        grupoCodigo: grupoCod,
        total: 0,
        completados: 0,
        pendientes: 0,
        retirados: 0,
      };
    }

    const g = gruposMap[etiquetaGrupo];
    g.total++;

    if (est.estadoEstudiante === "retirado") {
      g.retirados++;
      return;
    }

    const mod = est.modulos ? est.modulos[moduloNombre] : null;
    const pct = mod?.porcentajeAvance || 0;
    const convalidado = mod?.estaConvalidado || false;
    const completado = mod?.completado || false;

    if (completado || convalidado || pct === 100) {
      g.completados++;
    } else {
      g.pendientes++;
    }
  });

  const listaGrupos = Object.values(gruposMap).sort((a, b) => {
    return a.grupoCodigo.localeCompare(b.grupoCodigo, undefined, { numeric: true, sensitivity: "base" }) ||
           a.carreraFormateada.localeCompare(b.carreraFormateada, undefined, { sensitivity: "base" });
  });

  let sumTotal = 0;
  let sumCompletados = 0;
  let sumPendientes = 0;
  let sumRetirados = 0;

  const filasExcel = listaGrupos.map((g) => {
    sumTotal += g.total;
    sumCompletados += g.completados;
    sumPendientes += g.pendientes;
    sumRetirados += g.retirados;

    const evalSinRetirados = g.completados + g.pendientes;
    const pctComp = evalSinRetirados > 0 ? ((g.completados / evalSinRetirados) * 100).toFixed(1) : "0.0";
    const pctPend = evalSinRetirados > 0 ? ((g.pendientes / evalSinRetirados) * 100).toFixed(1) : "0.0";

    return {
      "Código Grupo": g.grupoCodigo,
      Carrera: g.carreraFormateada,
      "Total Estudiantes": g.total,
      Completados: g.completados,
      "% Completados": `${pctComp}%`,
      "Pendientes / En Riesgo": g.pendientes,
      "% Pendientes": `${pctPend}%`,
      Retirados: g.retirados,
    };
  });

  const evalTotalAula = sumCompletados + sumPendientes;
  const pctCompTotal = evalTotalAula > 0 ? ((sumCompletados / evalTotalAula) * 100).toFixed(1) : "0.0";
  const pctPendTotal = evalTotalAula > 0 ? ((sumPendientes / evalTotalAula) * 100).toFixed(1) : "0.0";

  filasExcel.push({
    "Código Grupo": "TOTAL",
    Carrera: "TOTAL ACUMULADO AULA",
    "Total Estudiantes": sumTotal,
    Completados: sumCompletados,
    "% Completados": `${pctCompTotal}%`,
    "Pendientes / En Riesgo": sumPendientes,
    "% Pendientes": `${pctPendTotal}%`,
    Retirados: sumRetirados,
  });

  const worksheet = XLSX.utils.json_to_sheet(filasExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen por Grupos");

  const hoy = new Date();
  const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const modClean = moduloNombre.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  const nombreArchivo = `AnaliTIC_Resumen_Grupos_${modClean}_${fechaStr}.xlsx`;

  XLSX.writeFile(workbook, nombreArchivo);
}

/**
 * Función principal que despliega el modal e integra el selector de módulo interno.
 */
export function mostrarModalMetricasAula(datosEstudiantes, moduloNombreActual, configAula) {
  const modalEl = document.getElementById("modalMetricasAula");
  if (!modalEl) return;

  let moduloSeleccionadoModal = moduloNombreActual;

  // Popular el Selector de Módulo dentro del Modal
  const selectorModuloModal = document.getElementById("modal-modulo-selector");
  if (selectorModuloModal && configAula && configAula.modulos) {
    const listaModulos = Object.keys(configAula.modulos);
    selectorModuloModal.innerHTML = listaModulos
      .map((mod) => `<option value="${mod}" ${mod === moduloSeleccionadoModal ? "selected" : ""}>Módulo: ${mod}</option>`)
      .join("");

    selectorModuloModal.onchange = (e) => {
      moduloSeleccionadoModal = e.target.value;
      renderizarGraficoDona(datosEstudiantes, moduloSeleccionadoModal);
      renderizarTablaComparativaGrupos(datosEstudiantes, moduloSeleccionadoModal);
    };
  }

  // Renderizados iniciales
  renderizarGraficoDona(datosEstudiantes, moduloSeleccionadoModal);
  renderizarTablaComparativaGrupos(datosEstudiantes, moduloSeleccionadoModal);

  // Vincular botón Excel
  const btnExcel = document.getElementById("btn-exportar-resumen-excel");
  if (btnExcel) {
    btnExcel.onclick = () => exportarResumenGruposExcel(datosEstudiantes, moduloSeleccionadoModal);
  }

  // Desplegar Modal
  const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  bsModal.show();

  // Redimensionar Canvas al cambiar a pestaña "General"
  const tabGeneral = document.getElementById("pills-general-tab");
  if (tabGeneral) {
    tabGeneral.addEventListener("shown.bs.tab", () => {
      if (miChart) miChart.resize();
    });
  }
}
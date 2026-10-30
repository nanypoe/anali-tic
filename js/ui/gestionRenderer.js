/* js/ui/gestionRenderer.js */

import {
  getEstudiantes,
  getConfigAula,
  getCambios,
  getNombreArchivo,
  registrarCambio,
  descartarCambios,
  obtenerBaseParaExportar,
} from "../core/store.js";
import { formatearEtiquetaGrupo } from "../core/groupFormat.js";

const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

let listaVisible = [];
let opcionesDelModal = { grupoInicial: "TODOS", onCambio: () => {} };
let eventosVinculados = false;

function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

/** Módulos que admiten convalidación según la configuración del aula. */
function modulosConConvalidacion(configAula) {
  const mapa = configAula?.convalidaciones_map || {};
  return Object.keys(mapa).filter((m) => configAula.modulos && configAula.modulos[m]);
}

function etiquetasGrupos(estudiantes) {
  const mapa = new Map();
  estudiantes.forEach((e) => {
    if (e.grupoInfo?.etiquetaGrupo && e.grupoInfo.etiquetaGrupo !== "Sin Grupo Asignado") {
      mapa.set(
        e.grupoInfo.etiquetaGrupo,
        formatearEtiquetaGrupo(e.grupoInfo),
      );
    }
  });
  return Array.from(mapa.entries()).sort((a, b) =>
    a[1].localeCompare(b[1], "es", { numeric: true, sensitivity: "base" }),
  );
}

function listaFiltrada() {
  const grupo = document.getElementById("gestion-grupo-selector")?.value || "TODOS";
  const termino = (document.getElementById("gestion-buscar")?.value || "").toLowerCase();

  return getEstudiantes()
    .filter((e) => grupo === "TODOS" || e.grupoInfo?.etiquetaGrupo === grupo)
    .filter((e) =>
      !termino ||
      `${e.nombre} ${e.apellidos} ${e.correo}`.toLowerCase().includes(termino),
    )
    .sort((a, b) =>
      `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`, "es", { sensitivity: "base" }),
    );
}

function renderizarCabecera(modulos) {
  const head = document.getElementById("gestion-head");
  if (!head) return;
  const celdasModulos = modulos
    .map(
      (m) => `<th class="text-center small" style="min-width: 120px" title="${escapar(m)}">
        <i class="bi bi-patch-check me-1"></i>${escapar(m)}
      </th>`,
    )
    .join("");
  head.innerHTML = `
    <tr>
      <th class="ps-3">Estudiante</th>
      <th class="text-center" style="min-width: 150px">Estado</th>
      ${celdasModulos || '<th class="text-center text-muted small">Sin convalidaciones en esta aula</th>'}
    </tr>`;
}

function botonEstado(est, hayRegistro) {
  const retirado = est.estadoEstudiante === "retirado";
  const clase = retirado ? "btn-secondary" : "btn-outline-success";
  const icono = retirado ? "bi-person-dash-fill" : "bi-person-check-fill";
  const texto = retirado ? "Retirado" : "Activo";
  return `<button type="button" class="btn btn-sm ${clase} fw-semibold w-100" data-accion="estado"
      ${hayRegistro ? "" : "disabled"}
      title="${retirado ? "Reactivar estudiante" : "Marcar como retirado: sale de conteos y pendientes"}">
      <i class="bi ${icono} me-1"></i>${texto}
    </button>`;
}

function botonConvalidacion(est, modulo, hayRegistro) {
  const convalidado = Boolean(est.modulos?.[modulo]?.estaConvalidado) ||
    Boolean(est.convalidaciones?.[modulo]);
  const clase = convalidado ? "btn-primary" : "btn-outline-secondary";
  const icono = convalidado ? "bi-check-circle-fill" : "bi-circle";
  const texto = convalidado ? "Convalidado" : "No convalidado";
  return `<button type="button" class="btn btn-sm ${clase} w-100 text-nowrap" data-accion="conv" data-modulo="${escapar(modulo)}"
      ${hayRegistro ? "" : "disabled"} title="Cambiar convalidación de ${escapar(modulo)}">
      <i class="bi ${icono} me-1"></i>${texto}
    </button>`;
}

function renderizarFilas() {
  const body = document.getElementById("gestion-body");
  const resumen = document.getElementById("gestion-resumen");
  if (!body) return;

  const configAula = getConfigAula();
  const modulos = modulosConConvalidacion(configAula);
  renderizarCabecera(modulos);

  listaVisible = listaFiltrada();

  if (listaVisible.length === 0) {
    body.innerHTML = `<tr><td colspan="${modulos.length + 2}" class="text-center text-muted py-4">No hay estudiantes para este filtro</td></tr>`;
  } else {
    body.innerHTML = listaVisible
      .map((est, idx) => {
        const hayRegistro = Boolean(est.infoDb);
        const retirado = est.estadoEstudiante === "retirado";
        const avisoSinRegistro = hayRegistro
          ? ""
          : `<div class="small text-danger"><i class="bi bi-exclamation-triangle me-1"></i>Sin registro en la base de datos</div>`;

        const celdasConv = modulos
          .map((m) => `<td class="text-center">${botonConvalidacion(est, m, hayRegistro)}</td>`)
          .join("");

        return `
          <tr class="${retirado ? "table-secondary" : ""}" data-idx="${idx}">
            <td class="ps-3">
              <div class="fw-semibold text-uppercase small ${retirado ? "text-muted" : "text-primary"}">${escapar(est.nombre)} ${escapar(est.apellidos)}</div>
              <div class="small text-muted">${escapar(formatearEtiquetaGrupo(est.grupoInfo))}</div>
              ${avisoSinRegistro}
            </td>
            <td class="text-center">${botonEstado(est, hayRegistro)}</td>
            ${celdasConv}
          </tr>`;
      })
      .join("");
  }

  if (resumen) {
    const retirados = listaVisible.filter((e) => e.estadoEstudiante === "retirado").length;
    resumen.textContent = `${listaVisible.length} estudiante(s) · ${retirados} retirado(s)`;
  }

  const aviso = document.getElementById("gestion-aviso");
  const cambios = getCambios().length;
  if (aviso) {
    aviso.innerHTML = cambios
      ? `<i class="bi bi-floppy me-1"></i><strong>${cambios}</strong> cambio(s) guardados en este navegador. Exporta la base para llevarlos al Excel.`
      : `<i class="bi bi-check2-circle me-1"></i>Sin cambios pendientes. Los cambios se guardan automáticamente en este navegador.`;
  }

  const btnDescartar = document.getElementById("btn-gestion-descartar");
  if (btnDescartar) btnDescartar.disabled = cambios === 0;
}

function aplicarCambio(est, tipo, valor, modulo = null) {
  try {
    const nuevos = registrarCambio(est, tipo, valor, modulo);
    opcionesDelModal.onCambio(nuevos);
    renderizarFilas();
  } catch (error) {
    alert(error.message);
  }
}

function manejarClicTabla(e) {
  const boton = e.target.closest("button[data-accion]");
  if (!boton || boton.disabled) return;
  const fila = boton.closest("tr[data-idx]");
  const est = listaVisible[Number(fila?.dataset.idx)];
  if (!est) return;

  if (boton.dataset.accion === "estado") {
    const nuevo = est.estadoEstudiante === "retirado" ? "Activo" : "Retirado";
    aplicarCambio(est, "estado", nuevo);
  } else if (boton.dataset.accion === "conv") {
    const modulo = boton.dataset.modulo;
    const convalidado = Boolean(est.modulos?.[modulo]?.estaConvalidado);
    aplicarCambio(est, "convalidacion", convalidado ? "No" : "Sí", modulo);
  }
}

/** Nombre de archivo sugerido: Base_Actualizada_<nombre original>_<fecha>.xlsx */
function nombreSugerido() {
  const base = (getNombreArchivo() || "base").replace(/\.(xlsx|ods)$/i, "").replace(/[^a-zA-Z0-9_\-]+/g, "_");
  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}`;
  return `Base_Actualizada_${base}_${fecha}.xlsx`;
}

/**
 * Exporta la base de datos con los cambios aplicados.
 * En Chromium/Edge abre el selector "Guardar como" (puede sobrescribir el original).
 * En otros navegadores descarga el archivo.
 */
export async function exportarBaseDatos() {
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar SheetJS para exportar.");
    return;
  }

  const { columnas, filas } = obtenerBaseParaExportar();
  const hoja = XLSX.utils.json_to_sheet(filas, { header: columnas });
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Base de datos");
  const bytes = XLSX.write(libro, { bookType: "xlsx", type: "array" });
  const blob = new Blob([bytes], { type: MIME_XLSX });
  const nombre = nombreSugerido();

  if (typeof window.showSaveFilePicker === "function") {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: nombre,
        types: [{ description: "Libro de Excel", accept: { [MIME_XLSX]: [".xlsx"] } }],
      });
      const escritura = await handle.createWritable();
      await escritura.write(blob);
      await escritura.close();
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.warn("Guardado nativo no disponible, se descargará el archivo.", error);
    }
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function vincularEventosUnaVez() {
  if (eventosVinculados) return;
  eventosVinculados = true;

  document.getElementById("gestion-body")?.addEventListener("click", manejarClicTabla);
  document.getElementById("gestion-grupo-selector")?.addEventListener("change", renderizarFilas);
  document.getElementById("gestion-buscar")?.addEventListener("input", renderizarFilas);

  document.getElementById("btn-gestion-descartar")?.addEventListener("click", () => {
    if (!confirm("¿Descartar todos los cambios hechos en esta sesión? Se restaurará la base original.")) return;
    opcionesDelModal.onCambio(descartarCambios());
    renderizarFilas();
  });

  document.getElementById("btn-gestion-exportar")?.addEventListener("click", exportarBaseDatos);
}

/**
 * Abre el modal de gestión de estudiantes (estado y convalidaciones).
 */
export function mostrarModalGestion(opciones = {}) {
  const modalEl = document.getElementById("modalGestionEstudiantes");
  if (!modalEl) return;

  opcionesDelModal = {
    grupoInicial: opciones.grupoInicial || "TODOS",
    onCambio: opciones.onCambio || (() => {}),
  };

  const selector = document.getElementById("gestion-grupo-selector");
  if (selector) {
    const grupos = etiquetasGrupos(getEstudiantes());
    selector.innerHTML =
      `<option value="TODOS">Todos los grupos</option>` +
      grupos.map(([clave, etiqueta]) =>
        `<option value="${escapar(clave)}">${escapar(etiqueta)}</option>`,
      ).join("");
    selector.value = grupos.some(([clave]) => clave === opcionesDelModal.grupoInicial)
      ? opcionesDelModal.grupoInicial
      : "TODOS";
  }

  const buscar = document.getElementById("gestion-buscar");
  if (buscar) buscar.value = "";

  vincularEventosUnaVez();
  renderizarFilas();

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

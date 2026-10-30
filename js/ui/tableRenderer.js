/* js/ui/tableRenderer.js */

import {
  mostrarModalBoletaIndividual,
  copiarListaWhatsAppGrupal,
} from "./modalRenderer.js";

import { mostrarModalMetricasAula } from "./chartRenderer.js";
import { mostrarModalExportacionPendientes } from "./exportRenderer.js";
import { mostrarModalEsquela } from "./esquelaRenderer.js";
import { mostrarModalGestion } from "./gestionRenderer.js";
import { exportarTablaExcel } from "./exportTablaRenderer.js";
import { estadoCierre } from "../core/fechas.js";
import { getTipoBase } from "../core/store.js";
import { formatearEtiquetaGrupo } from "../core/groupFormat.js";
import { pulsar, toast } from "./feedback.js";
import { colorModulo } from "./paletaModulos.js";
import { conTemaClaro } from "./tema.js";

const tipoBaseTic = () => getTipoBase() === "tic";

let modoReporte = false;
let moduloActivo = "";
let grupoActivo = "TODOS";
let filtroEstadoActivo = "TODOS";
let mostrarRetiradosEnTodos = false;

// Datos vigentes. Se reemplazan al registrar cambios, para que los manejadores
// de eventos siempre trabajen con la información actual.
let datosActuales = [];
let configActual = null;
let ultimosVisibles = [];

export function inicializarControlesTabla(datosEstudiantes, configAula) {
  datosActuales = datosEstudiantes;
  configActual = configAula;
  moduloActivo = Object.keys(configAula.modulos)[0];

  renderizarPildorasModulos();
  popularSelectorGrupos();
  configurarFiltrosEstado();

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.oninput = () => ejecutarRenderizado(false);

  const chkRetirados = document.getElementById("chk-mostrar-retirados");
  if (chkRetirados) {
    chkRetirados.checked = mostrarRetiradosEnTodos;
    chkRetirados.onchange = (e) => {
      mostrarRetiradosEnTodos = e.target.checked;
      ejecutarRenderizado();
    };
  }

  const btnModoReporte = document.getElementById("btn-modo-reporte");
  if (btnModoReporte) {
    btnModoReporte.onclick = () => {
      modoReporte = !modoReporte;
      btnModoReporte.innerText = modoReporte
        ? "Mostrar calificaciones"
        : "Ocultar calificaciones";
      btnModoReporte.classList.toggle("btn-dark");
      btnModoReporte.classList.toggle("btn-primary");
      ejecutarRenderizado();
    };
  }

  const btnMetricas = document.getElementById("btn-ver-tabla-grupos");
  if (btnMetricas) {
    btnMetricas.onclick = () => {
      mostrarModalMetricasAula(datosActuales, moduloActivo, configActual);
    };
  }

  const btnGestion = document.getElementById("btn-gestionar-estudiantes");
  if (btnGestion) {
    btnGestion.onclick = () => {
      mostrarModalGestion({
        grupoInicial: grupoActivo,
        onCambio: (nuevosDatos) => refrescarTabla(nuevosDatos),
      });
    };
  }

  const btnExportarTabla = document.getElementById("btn-exportar-tabla");
  if (btnExportarTabla) {
    btnExportarTabla.onclick = () => {
      exportarTablaExcel(ultimosVisibles, moduloActivo, configActual, construirMetaVista(ultimosVisibles));
    };
  }

  const btnExportarPendientes = document.getElementById("btn-exportar-pendientes");
  if (btnExportarPendientes) {
    btnExportarPendientes.onclick = () => {
      mostrarModalExportacionPendientes(datosActuales, configActual);
    };
  }

  const btnEsquelaGlobal = document.getElementById("btn-esquela-global");
  if (btnEsquelaGlobal) {
    btnEsquelaGlobal.onclick = () => {
      mostrarModalEsquela(datosActuales, configActual);
    };
  }

  ejecutarRenderizado();
}

/**
 * Actualiza la tabla con datos nuevos (tras editar estados o convalidaciones),
 * conservando los filtros activos.
 */
export function refrescarTabla(nuevosDatos) {
  datosActuales = nuevosDatos;
  popularSelectorGrupos();
  ejecutarRenderizado();
}

/** Paleta por módulo: cada módulo tiene su color al activarse. */
/** Icono según el nombre del módulo (palabras clave). */
function iconoModulo(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes("histor")) return "bi-bank2";
  if (n.includes("clima") || n.includes("ambient")) return "bi-tree-fill";
  if (n.includes("laboral")) return "bi-briefcase-fill";
  if (n.includes("cultural")) return "bi-palette-fill";
  if (n.includes("paz")) return "bi-balloon-heart-fill";
  if (n.includes("ofim")) return "bi-file-earmark-spreadsheet-fill";
  if (n.includes("excel")) return "bi-table";
  if (n.includes("contab") || n.includes("control")) return "bi-calculator-fill";
  return "bi-journal-bookmark-fill";
}

function renderizarPildorasModulos() {
  const container = document.getElementById("pills-modulos");
  if (!container) return;

  const modulos = Object.keys(configActual.modulos);
  container.innerHTML = modulos
    .map(
      (mod, idx) => `
    <button class="btn-pill btn-pill-modulo ${mod === moduloActivo ? "active" : ""}" data-modulo="${mod}"
            style="--pill-color:#${colorModulo(idx)}" title="${mod}">
      <i class="bi ${iconoModulo(mod)} pill-icono"></i><span class="pill-texto">${mod}</span>
    </button>
  `,
    )
    .join("");

  container.querySelectorAll(".btn-pill").forEach((btn) => {
    btn.onclick = () => {
      container
        .querySelectorAll(".btn-pill")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      pulsar(btn);
      moduloActivo = btn.getAttribute("data-modulo");
      toast(`Módulo: ${moduloActivo}`, "info");
      ejecutarRenderizado();
    };
  });
}

function popularSelectorGrupos() {
  const grupoSelect = document.getElementById("grupo-selector");
  if (!grupoSelect) return;

  const gruposMap = new Map();
  datosActuales.forEach((est) => {
    const info = est.grupoInfo;
    const etiqueta = info?.etiquetaGrupo;
    if (!etiqueta || gruposMap.has(etiqueta)) return;

    gruposMap.set(etiqueta, formatearEtiquetaGrupo(info));
  });

  const grupos = Array.from(gruposMap.entries()).filter(
    ([grupo]) => grupo !== "Sin Grupo Asignado",
  );
  grupos.sort(([grupoA, etiquetaA], [grupoB, etiquetaB]) =>
    tipoBaseTic()
      ? etiquetaA.localeCompare(etiquetaB, "es", { numeric: true, sensitivity: "base" })
      : grupoA < grupoB
        ? -1
        : grupoA > grupoB
          ? 1
          : 0,
  );

  if (grupoActivo !== "TODOS" && !grupos.some(([grupo]) => grupo === grupoActivo)) {
    grupoActivo = "TODOS";
  }

  grupoSelect.replaceChildren(
    new Option(tipoBaseTic() ? "TODOS LOS GRUPOS" : "Todos los grupos", "TODOS"),
  );
  grupos.forEach(([grupo, etiqueta]) => {
    grupoSelect.add(new Option(etiqueta, grupo));
  });
  grupoSelect.value = grupoActivo;
  grupoSelect.onchange = (e) => {
    grupoActivo = e.target.value;
    ejecutarRenderizado();
  };
}

function configurarFiltrosEstado() {
  const container = document.getElementById("pills-estados");
  if (!container) return;

  container.querySelectorAll(".btn-pill").forEach((btn) => {
    btn.onclick = (e) => {
      const estadoAttr = btn.getAttribute("data-estado");
      if (
        e.target.classList.contains("badge") &&
        (estadoAttr === "COMPLETADO" || estadoAttr === "PENDIENTE")
      ) {
        const tipoWA = estadoAttr === "COMPLETADO" ? "COMPLETADOS" : "PENDIENTES";
        copiarListaWhatsAppGrupal(datosActuales, moduloActivo, grupoActivo, tipoWA, {
          configAula: configActual,
          esTic: tipoBaseTic(),
          elemento: btn,
          etiquetaGrupo: document.getElementById("grupo-selector")?.selectedOptions[0]?.textContent,
        });
        return;
      }

      container
        .querySelectorAll(".btn-pill")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      pulsar(btn);
      filtroEstadoActivo = estadoAttr;
      ejecutarRenderizado();
      toast(`${ETIQUETAS_FILTRO[estadoAttr]}: ${ultimosVisibles.length} estudiante(s)`, estadoAttr === "RETIRADO" ? "aviso" : "info");
    };
  });
}

/**
 * Regla única de visibilidad:
 * - Retirados solo aparecen en el filtro "Retirados".
 * - En "TODOS" aparecen únicamente si el switch "Incluir retirados" está activo.
 * - Cualquier otro filtro (Completados, Pendientes, Convalidados) excluye a los retirados.
 */
function filtrarPorEstado(lista) {
  return lista.filter((est) => {
    const retirado = est.estadoEstudiante === "retirado";

    if (filtroEstadoActivo === "RETIRADO") return retirado;
    if (filtroEstadoActivo === "TODOS") return !retirado || mostrarRetiradosEnTodos;
    if (retirado) return false;

    const mod = est.modulos ? est.modulos[moduloActivo] : null;
    if (!mod) return false;
    if (filtroEstadoActivo === "CONVALIDADO") return mod.estaConvalidado;
    if (filtroEstadoActivo === "COMPLETADO") return mod.completado && !mod.estaConvalidado;
    if (filtroEstadoActivo === "PENDIENTE") return !mod.completado && !mod.estaConvalidado;
    return true;
  });
}

function ejecutarRenderizado(animarFilas = true) {
  const searchInput = document.getElementById("search-input");
  const termino = searchInput ? searchInput.value.toLowerCase() : "";

  // 1. Filtrado por Grupo
  let filtrados =
    grupoActivo === "TODOS"
      ? datosActuales
      : datosActuales.filter(
          (est) => est.grupoInfo && est.grupoInfo.etiquetaGrupo === grupoActivo,
        );

  // 2. Filtrado por Búsqueda
  if (termino) {
    filtrados = filtrados.filter((est) =>
      `${est.nombre} ${est.apellidos} ${est.correo}`
        .toLowerCase()
        .includes(termino),
    );
  }

  // 3. Métricas de las píldoras (según el grupo y la búsqueda)
  actualizarBadgesMetricas(filtrados);

  // 4. Filtrado por estado (aplica la regla de retirados)
  filtrados = filtrarPorEstado(filtrados);

  filtrados.sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
  );

  ultimosVisibles = filtrados;

  // La captura y la exportación siempre usan exactamente lo que se ve en pantalla
  const btnCaptura = document.getElementById("btn-capturar-tabla");
  if (btnCaptura) btnCaptura.onclick = () => capturarTablaComoImagen(ultimosVisibles);

  // El switch solo tiene sentido en la píldora TODOS
  const chk = document.getElementById("chk-mostrar-retirados");
  if (chk) {
    chk.disabled = filtroEstadoActivo !== "TODOS";
    chk.closest(".form-switch")?.classList.toggle("opacity-50", filtroEstadoActivo !== "TODOS");
  }

  renderizarTabla(filtrados, configActual, datosActuales, animarFilas);
}

function actualizarBadgesMetricas(estudiantesVisibles) {
  let tod = 0, comp = 0, prog = 0, conv = 0, ret = 0;

  estudiantesVisibles.forEach((est) => {
    const esRetirado = est.estadoEstudiante === "retirado";
    if (esRetirado) ret++;
    if (!esRetirado || mostrarRetiradosEnTodos) tod++;

    const mod = est.modulos ? est.modulos[moduloActivo] : null;
    if (!mod || esRetirado) return;
    if (mod.estaConvalidado) conv++;
    else if (mod.completado) comp++;
    else prog++;
  });

  const setBadge = (id, val) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.innerText !== String(val)) {
      el.innerText = val;
      el.classList.remove("badge-pop");
      void el.offsetWidth;
      el.classList.add("badge-pop");
    }
  };

  setBadge("badge-cnt-todos", tod);
  setBadge("badge-cnt-completados", comp);
  setBadge("badge-cnt-pendientes", prog);
  setBadge("badge-cnt-convalidados", conv);
  setBadge("badge-cnt-retirados", ret);
}

export function renderizarTabla(datos, configAula, datosCompletos = datos, animarFilas = true) {
  const tbody = document.getElementById("tabla-body");
  const head = document.getElementById("tabla-head");

  if (!tbody || !head) return;

  tbody.innerHTML = "";
  tbody.classList.toggle("animar-filas", animarFilas);
  head.innerHTML = "";

  if (!datos || datos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="100%"><div class="vacio-ilustrado"><img src="./assets/ilustracion-vacio.svg" alt="" /><div class="fw-semibold">No hay estudiantes para este filtro</div><small>Prueba con otro grupo, otra píldora o limpia la búsqueda.</small></div></td></tr>`;
    return;
  }

  const tipoAula = (configAula && configAula.tipo) ? String(configAula.tipo).toLowerCase().trim() : "modulo";
  const unidadesConfig = configAula.modulos[moduloActivo];
  let totalCuestionariosModulo = 0;
  let filaCues = `<tr>`;

  for (let uni in unidadesConfig) {
    totalCuestionariosModulo += unidadesConfig[uni].length;
  }

  // Encabezado: Estudiante, Acciones, ACTIVIDADES y Estado.
  let filaUni = `<tr>
    <th rowspan="3" class="align-middle text-start px-3 col-estudiante">Estudiante</th>
    <th rowspan="3" class="align-middle text-center col-acciones">Acciones</th>
    <th colspan="${totalCuestionariosModulo}" class="text-center fw-bold col-actividades align-middle" style="letter-spacing: 1px;">ACTIVIDADES</th>
    <th rowspan="3" class="align-middle text-center">Estado</th>
  </tr><tr>`;

  for (let uni in unidadesConfig) {
    const cuestionarios = unidadesConfig[uni];
    filaUni += `<th colspan="${cuestionarios.length}" class="bg-primary text-white p-1 text-center" style="font-size: 0.65rem">${uni}</th>`;
    cuestionarios.forEach((c, i) => {
      filaCues += `<th title="${c}" class="text-center" style="font-size: 0.65rem; min-width: 42px">A${i + 1}</th>`;
    });
  }

  filaUni += `</tr>`;
  filaCues += `</tr>`;

  head.innerHTML = filaUni + filaCues;

  datos.forEach((est) => {
    const tr = document.createElement("tr");
    tr.className = "row-estudiante";
    tr.style.cursor = "pointer";
    tr.tabIndex = 0;
    tr.setAttribute("aria-label", `Abrir boleta individual de ${est.nombre} ${est.apellidos}`);

    const modData = est.modulos ? est.modulos[moduloActivo] : null;
    const esRetirado = est.estadoEstudiante === "retirado";
    const esConvalidado = modData && modData.estaConvalidado;

    let filaHTML = `
      <td class="text-start px-3 py-2">
        <div class="fw-semibold text-uppercase small text-primary col-estudiante">${est.nombre} ${est.apellidos}</div>
      </td>
      <td class="text-center align-middle col-acciones acciones-fila">
        <button class="btn btn-xs btn-outline-secondary btn-boleta" type="button"
                data-bs-toggle="tooltip" data-bs-placement="top" title="Abrir boleta"
                aria-label="Abrir boleta individual">
          <i class="bi bi-person-vcard"></i>
        </button>
        ${
          esRetirado
            ? ""
            : `<button class="btn btn-xs btn-outline-primary btn-esquela" type="button"
                       data-bs-toggle="tooltip" data-bs-placement="top" title="Generar esquela"
                       aria-label="Generar esquela de compromiso">
                <i class="bi bi-file-earmark-word-fill"></i>
              </button>`
        }
      </td>
    `;

    if (esRetirado) {
      filaHTML += `<td colspan="${totalCuestionariosModulo}" class="text-center cell-retirado align-middle bg-secondary text-white">
                    <i class="bi bi-x-circle-fill me-1"></i> RETIRADO
                   </td>`;
    } else if (esConvalidado) {
      filaHTML += `<td colspan="${totalCuestionariosModulo}" class="text-center cell-convalidado align-middle">
                    <i class="bi bi-patch-check-fill me-1"></i> CONVALIDADO
                   </td>`;
    } else if (modData) {
      for (let uni in modData.unidades) {
        modData.unidades[uni].forEach((c) => {
          let color = "#f3e2a3"; // Amarillo por defecto (PENDIENTE)

          if (c.estado === "REALIZADO" || c.estado === "APROBADO") {
            color = "#95f7c0"; // Verde
          } else if (c.estado === "REPROBADO") {
            color = "#f3a2a2"; // Rojo
          }

          let contenido = c.nota;
          if (modoReporte) {
            contenido = `<span style="font-size: 9px">${c.estado}</span>`;
          } else if (tipoAula === "curso" && c.estado === "REALIZADO") {
            contenido = c.nota !== undefined && c.nota !== null ? c.nota : "REALIZADO";
          }

          filaHTML += `<td class="text-center fw-bold align-middle celda-actividad" style="background-color: ${color}">${contenido}</td>`;
        });
      }
    }

    let badgeClase = "bg-warning text-dark";
    let textoEstado = "PENDIENTE";

    if (esRetirado) {
      badgeClase = "bg-secondary text-white";
      textoEstado = "RETIRADO";
    } else if (esConvalidado) {
      badgeClase = "bg-primary text-white";
      textoEstado = "CONVALIDADO";
    } else if (modData && modData.completado) {
      badgeClase = "bg-success text-white";
      textoEstado = "COMPLETADO";
    }

    const iconoEstado = {
      RETIRADO: "bi-person-dash-fill",
      CONVALIDADO: "bi-patch-check-fill",
      COMPLETADO: "bi-check2-circle",
      PENDIENTE: "bi-hourglass-split",
    }[textoEstado];
    filaHTML += `<td class="text-center align-middle"><span class="badge badge-estado ${badgeClase}"><i class="bi ${iconoEstado} me-1"></i>${textoEstado}</span></td>`;
    tr.innerHTML = filaHTML;

    tr.onclick = () => mostrarModalBoletaIndividual(est, moduloActivo, configAula);
    tr.onkeydown = (event) => {
      if (event.target !== tr) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        mostrarModalBoletaIndividual(est, moduloActivo, configAula);
      }
    };

    const btnBoleta = tr.querySelector(".btn-boleta");
    if (btnBoleta) {
      btnBoleta.onclick = (event) => {
        event.stopPropagation();
        mostrarModalBoletaIndividual(est, moduloActivo, configAula);
      };
    }

    const btnEsquela = tr.querySelector(".btn-esquela");
    if (btnEsquela) {
      btnEsquela.onclick = (e) => {
        e.stopPropagation();
        mostrarModalEsquela(datosCompletos, configAula, est);
      };
    }
    tr.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((elemento) => {
      bootstrap.Tooltip.getOrCreateInstance(elemento);
    });

    tbody.appendChild(tr);
  });
}

const ETIQUETAS_FILTRO = {
  TODOS: "Todos los estudiantes",
  COMPLETADO: "Completados",
  PENDIENTE: "Pendientes",
  CONVALIDADO: "Convalidados",
  RETIRADO: "Retirados",
};

/** Metadatos de la vista actual: se usan en el encabezado de la captura y del Excel. */
function construirMetaVista(visibles) {
  const grupoSelect = document.getElementById("grupo-selector");
  const grupo =
    grupoSelect && grupoSelect.selectedIndex >= 0
      ? grupoSelect.options[grupoSelect.selectedIndex].text.trim()
      : "Todos los grupos";
  const turnos = [...new Set(visibles.map((e) => e.grupoInfo?.turno).filter(Boolean))];
  const turno = turnos.length === 1 ? turnos[0] : turnos.length > 1 ? "Varios turnos" : "Sin turno";
  return {
    grupo,
    turno,
    filtro: ETIQUETAS_FILTRO[filtroEstadoActivo] || "Todos los estudiantes",
    incluyeRetirados: filtroEstadoActivo === "TODOS" && mostrarRetiradosEnTodos,
    cierre: tipoBaseTic() ? estadoCierre(configActual, moduloActivo) : null,
  };
}

function capturarTablaComoImagen(datosEstudiantesVisibles = []) {
  const tabla = document.getElementById("tabla-resultados");
  const btn = document.getElementById("btn-capturar-tabla");
  if (!tabla || !btn) return;

  const areaCaptura = tabla.parentElement;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Generando...`;
  btn.disabled = true;

  const estiloOriginalTablaWidth = tabla.style.width;
  const estiloOriginalContenedorWidth = areaCaptura.style.width;
  const estiloOriginalFlex = areaCaptura.style.flex;
  const estiloOriginalDisplay = areaCaptura.style.display;

  const elementosAcciones = areaCaptura.querySelectorAll(".col-acciones");
  elementosAcciones.forEach((el) => {
    el.dataset.displayOriginal = el.style.display;
    el.style.display = "none";
  });

  tabla.style.setProperty("width", "max-content", "important");
  // Se libera el scroll para que la captura incluya todas las filas, no solo las visibles
  const estiloScrollOriginal = { overflow: areaCaptura.style.overflow, maxHeight: areaCaptura.style.maxHeight, height: areaCaptura.style.height };
  areaCaptura.style.overflow = "visible";
  areaCaptura.style.maxHeight = "none";
  areaCaptura.style.height = "auto";
  areaCaptura.classList.add("captura-estatica");
  areaCaptura.style.width = "fit-content";
  areaCaptura.style.display = "inline-block";

  const { grupo: textoGrupo, turno, filtro, incluyeRetirados, cierre } = construirMetaVista(datosEstudiantesVisibles);

  const lineaCierre = cierre && cierre.estado !== "sin_fecha"
    ? `<span style="padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap;
         background-color: ${cierre.estado === "vencido" ? "#FF6B5B" : "#FFF3C4"}; color: ${cierre.estado === "vencido" ? "#FFFFFF" : "#5B3A00"};">
         ${cierre.estado === "vencido" ? "Cerrado" : "Cierre"}: ${cierre.textoCorto}
       </span>`
    : "";

  const header = document.createElement("div");
  header.id = "encabezado-captura-temp";
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px 14px;
    padding: 8px 14px;
    margin-bottom: 8px;
    background-color: #5B3DF5;
    border-radius: 10px;
    width: 100%;
    box-sizing: border-box;
    color: #FFFFFF;
    font-family: system-ui, sans-serif;
  `;
  header.innerHTML = `
    <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px 12px; min-width: 0; flex: 1 1 auto;">
      <span style="padding: 4px 10px; border-radius: 7px; background-color: #FFB703; color: #1E1B3A; font-size: 15px; font-weight: 800; text-transform: uppercase; white-space: nowrap;">${moduloActivo}</span>
      <span style="font-size: 12px; opacity: 0.95;">${textoGrupo} &nbsp;·&nbsp; Turno <b>${turno}</b> &nbsp;·&nbsp; ${filtro}${incluyeRetirados ? " + retirados" : ""} &nbsp;·&nbsp; <b>${datosEstudiantesVisibles.length}</b> estudiante(s)</span>
    </div>
    ${lineaCierre}
  `;
  areaCaptura.insertBefore(header, tabla);
  // El contenedor flexible tiende a estirarse: se fija al ancho real de la tabla para que el encabezado no sobresalga
  const anchoTabla = Math.ceil(tabla.getBoundingClientRect().width);
  areaCaptura.style.flex = "none";
  areaCaptura.style.width = `${anchoTabla}px`;
  header.style.width = `${anchoTabla}px`;

  const hoy = new Date();
  const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const horaStr = `${String(hoy.getHours()).padStart(2, "0")}:${String(hoy.getMinutes()).padStart(2, "0")}`;
  const limpiar = (t) => String(t).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  const nombreArchivo = `${fechaStr}_${horaStr}_${limpiar(moduloActivo)}_${limpiar(textoGrupo)}_${limpiar(filtro)}.png`;

  const restaurar = () => {
    elementosAcciones.forEach((el) => {
      el.style.display = el.dataset.displayOriginal || "";
      delete el.dataset.displayOriginal;
    });
    tabla.style.width = estiloOriginalTablaWidth;
    areaCaptura.classList.remove("captura-estatica");
    areaCaptura.style.overflow = estiloScrollOriginal.overflow;
    areaCaptura.style.maxHeight = estiloScrollOriginal.maxHeight;
    areaCaptura.style.height = estiloScrollOriginal.height;
    areaCaptura.style.width = estiloOriginalContenedorWidth;
    areaCaptura.style.flex = estiloOriginalFlex;
    areaCaptura.style.display = estiloOriginalDisplay;
    if (header.parentNode) header.parentNode.removeChild(header);
    btn.innerHTML = originalText;
    btn.disabled = false;
  };

  conTemaClaro(() => html2canvas(areaCaptura, { scale: 3, useCORS: true, backgroundColor: "#ffffff" }))
    .then((canvas) => {
      const link = document.createElement("a");
      link.download = nombreArchivo;
      link.href = canvas.toDataURL("image/png");
      link.click();
    })
    .catch((err) => {
      console.error("Error al capturar la imagen PNG:", err);
      alert("Error al capturar la imagen");
    })
    .finally(restaurar);
}

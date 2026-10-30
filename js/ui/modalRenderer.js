/* js/ui/modalRenderer.js */

import { getTipoBase } from "../core/store.js";
import { estadoCierre, formatearFechaHora, textoCierreDocumento } from "../core/fechas.js";
import { copiarTextoPortapapeles, toast } from "./feedback.js";
import { contrasenaPorDefecto, anioAcademico } from "../core/diccionarios.js";
import { formatearEtiquetaGrupo } from "../core/groupFormat.js";

/**
 * 2.1. Renderiza la Ficha/Boleta Individual en el modal #modalBoletaIndividual
 */
export function mostrarModalBoletaIndividual(estudiante, moduloNombre, configAula) {
  const modalEl = document.getElementById("modalBoletaIndividual");
  if (!modalEl) return;

  const modData = estudiante.modulos ? estudiante.modulos[moduloNombre] : null;
  const tipoAula = (configAula && configAula.tipo) ? String(configAula.tipo).toLowerCase().trim() : "modulo";

  // Extraer cuestionarios/actividades y calcular avance / listado de detalles
  let totalCuestionarios = 0;
  let cuestionariosCompletados = 0;
  const detallesCuestionarios = [];

  if (modData && modData.unidades) {
    Object.entries(modData.unidades).forEach(([uniNombre, cuestionarios]) => {
      cuestionarios.forEach((c, index) => {
        totalCuestionarios++;
        
        // Obtener y limpiar el nombre real/descriptivo
        const nombreLimpio = obtenerYLimpiarNombreCuestionario(c, uniNombre, index, moduloNombre, configAula);

        // En Cursos: "REALIZADO" o "CONVALIDADO". En Módulos: "APROBADO" o "CONVALIDADO".
        if (c.estado === "REALIZADO" || c.estado === "APROBADO" || c.estado === "CONVALIDADO") {
          cuestionariosCompletados++;
        }

        detallesCuestionarios.push({
          unidad: uniNombre,
          nombre: nombreLimpio,
          nota: c.nota,
          estado: c.estado
        });
      });
    });
  }

  const porcentaje = totalCuestionarios > 0 
    ? Math.round((cuestionariosCompletados / totalCuestionarios) * 100) 
    : 0;

  // Determinar Badge de Estado General
  const esRetirado = estudiante.estadoEstudiante === "retirado";
  const esConvalidado = modData && modData.estaConvalidado;
  let estadoBadgeHTML = '<span class="badge bg-warning text-dark">PENDIENTE</span>';

  if (esRetirado) {
    estadoBadgeHTML = '<span class="badge bg-secondary">RETIRADO</span>';
  } else if (esConvalidado) {
    estadoBadgeHTML = '<span class="badge bg-primary">CONVALIDADO</span>';
  } else if (modData && modData.completado) {
    estadoBadgeHTML = '<span class="badge bg-success">COMPLETADO</span>';
  }

  // Verificar si la base de datos contiene teléfono
  const telefono = estudiante.datosContacto && estudiante.datosContacto.telefono
    ? String(estudiante.datosContacto.telefono).trim()
    : "";

  // Generar el texto formateado detallado para clipboard / WhatsApp
  const textoReporteDetallado = generarTextoReporteDetallado(
    estudiante, 
    moduloNombre, 
    porcentaje, 
    detallesCuestionarios,
    esRetirado,
    esConvalidado,
    tipoAula,
    configAula
  );

  const modalBody = modalEl.querySelector(".modal-body");
  const etiquetaTipo = tipoAula === "curso" ? "CURSO:" : "MÓDULO:";
  const etiquetaDetalle = tipoAula === "curso" ? "Detalle de Actividades" : "Detalle de Cuestionarios";

  // Construcción del HTML de la Boleta Individual
  modalBody.innerHTML = `
    <div id="area-captura-boleta" class="p-4 bg-white rounded shadow-sm border">
      <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
        <div>
          <h4 class="fw-bold text-primary mb-1 text-uppercase">${estudiante.nombre} ${estudiante.apellidos}</h4>
          <p class="text-muted small mb-1"><i class="bi bi-envelope-at me-1"></i>${estudiante.correo || 'Sin correo registrado'}</p>
          <span class="badge bg-light text-dark border"><i class="bi bi-people me-1"></i>${escaparAtributo(formatearEtiquetaGrupo(estudiante.grupoInfo))}</span>
        </div>
        <div class="text-end">
          <div class="mb-2">${estadoBadgeHTML}</div>
          <small class="text-muted fw-bold d-block">${etiquetaTipo}</small>
          <div class="modulo-chip mt-1">${moduloNombre}</div>
        </div>
      </div>

      ${renderizarAvisoCierre(configAula, moduloNombre)}

      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <small class="fw-bold text-muted">Avance del Módulo/Curso</small>
          <small class="fw-bold text-primary">${porcentaje}%</small>
        </div>
        <div class="progress progress-marca" style="height: 12px;">
          <div class="progress-bar progress-bar-marca ${porcentaje === 100 ? 'bg-success' : ''}" role="progressbar" style="width: ${porcentaje}%"></div>
        </div>
      </div>

      <h6 class="fw-bold text-secondary mb-3"><i class="bi bi-journal-text me-1"></i>${etiquetaDetalle}</h6>
      <div class="row g-3 mb-3">
        ${renderizarDesgloseUnidadesConNombres(modData, esRetirado, esConvalidado, moduloNombre, configAula)}
      </div>
    </div>

    ${renderizarBloqueCredenciales(estudiante)}

    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3 pt-3 border-top">
      <div>
        ${renderizarBotonWhatsAppDirecto(telefono, textoReporteDetallado)}
        <button class="btn btn-sm btn-outline-secondary" id="btn-copiar-reporte-txt">
          <i class="bi bi-clipboard me-1"></i> Copiar Reporte
        </button>
      </div>
      <button class="btn btn-sm btn-success" id="btn-capturar-boleta">
        <i class="bi bi-camera me-1"></i> Capturar Ficha (PNG)
      </button>
    </div>
  `;

  // Asignar eventos a los botones internos del modal
  const btnCopiar = modalBody.querySelector("#btn-copiar-reporte-txt");
  if (btnCopiar) {
    btnCopiar.onclick = () => copiarTextoPortapapeles(
      textoReporteDetallado,
      btnCopiar,
      "Reporte copiado al portapapeles",
    );
  }

  vincularBloqueCredenciales(modalBody);

  const btnCapturar = modalBody.querySelector("#btn-capturar-boleta");
  if (btnCapturar) {
    btnCapturar.onclick = () => capturarBoletaComoImagen(estudiante);
  }

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}

/**
 * Bloque de credenciales dentro de la boleta. Oculto por defecto y fuera del área de captura PNG.
 */
function renderizarBloqueCredenciales(estudiante) {
  const datos = estudiante.datosContacto || {};
  if (!datos.usuario && !datos.contrasena) {
    return `<div class="small text-muted mt-3"><i class="bi bi-shield-exclamation me-1"></i>Credenciales de CAMPUS no disponibles en la base de datos.</div>`;
  }
  const etiquetaOrigen = datos.contrasenaPorDefecto
    ? `<span class="badge bg-warning-subtle text-dark ms-1" title="La base no trae contraseña; se usa la del año ${anioAcademico()}">por defecto ${anioAcademico()}</span>`
    : "";
  const campo = (etiqueta, valor, etiquetaTooltip = etiqueta) => `
    <div class="mb-2">
      <small class="text-muted d-block fw-bold">${etiqueta}</small>
      <div class="input-group input-group-sm">
        <input type="text" readonly class="form-control bg-white credencial-valor" value="${escaparAtributo(valor)}" />
        <button class="btn btn-outline-primary btn-copiar-credencial" type="button" data-valor="${escaparAtributo(valor)}"
                data-bs-toggle="tooltip" data-bs-placement="top" title="Copiar ${escaparAtributo(etiquetaTooltip.toLowerCase())}"
                aria-label="Copiar ${escaparAtributo(etiquetaTooltip.toLowerCase())}">
          <i class="bi bi-clipboard"></i>
        </button>
      </div>
    </div>`;
  return `
    <div class="mt-3 border rounded-3 p-3 bg-light">
      <div class="d-flex justify-content-between align-items-center">
        <small class="fw-bold text-muted"><i class="bi bi-shield-lock me-1"></i>Credenciales CAMPUS</small>
        <button class="btn btn-sm btn-outline-secondary" type="button" id="btn-mostrar-credenciales">
          <i class="bi bi-eye me-1"></i> Mostrar
        </button>
      </div>
      <div id="bloque-credenciales" class="d-none mt-3">
        ${campo("USUARIO", datos.usuario || "")}
        ${campo("CONTRASEÑA" + etiquetaOrigen, datos.contrasena || "", "contraseña")}
      </div>
    </div>`;
}

function escaparAtributo(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function vincularBloqueCredenciales(contenedor) {
  const btnMostrar = contenedor.querySelector("#btn-mostrar-credenciales");
  const bloque = contenedor.querySelector("#bloque-credenciales");
  if (btnMostrar && bloque) {
    btnMostrar.onclick = () => {
      const oculto = bloque.classList.toggle("d-none");
      btnMostrar.innerHTML = oculto
        ? '<i class="bi bi-eye me-1"></i> Mostrar'
        : '<i class="bi bi-eye-slash me-1"></i> Ocultar';
    };
  }
  contenedor.querySelectorAll(".btn-copiar-credencial").forEach((btn) => {
    btn.onclick = () => copiarTextoPortapapeles(
      btn.dataset.valor,
      btn,
      `${btn.getAttribute("aria-label").replace(/^Copiar /, "")} copiado`,
    );
    bootstrap.Tooltip.getOrCreateInstance(btn);
  });
}

/**
 * Obtiene y sanitiza el nombre del cuestionario/actividad eliminando prefijos redundantes
 */
function obtenerYLimpiarNombreCuestionario(c, uniNombre, index, moduloNombre, configAula) {
  let nombreRaw = "";
  if (configAula && configAula.modulos && configAula.modulos[moduloNombre] && configAula.modulos[moduloNombre][uniNombre]) {
    const arrayNombres = configAula.modulos[moduloNombre][uniNombre];
    if (arrayNombres[index]) {
      nombreRaw = arrayNombres[index];
    }
  }

  if (!nombreRaw) {
    nombreRaw = c.headerOriginal || c.nombre || `Actividad ${index + 1}`;
  }

  let limpio = nombreRaw
    .replace(/^Cuestionario\s*(Evaluativo)?\s*(N[°ºo]?\s*\d+|\d+)?\s*[:\-–]?\s*/i, "")
    .replace(/^Cuestionario\s*[:\-–]?\s*/i, "")
    .replace(/^(Tarea|Foro|Actividad)\s*[:\-–]?\s*/i, "")
    .trim();

  if (!limpio) {
    limpio = nombreRaw;
  }

  return `A${index + 1}: ${limpio}`;
}

/**
 * Genera el desglose visual asignando el color del badge según el estado
 */
function renderizarDesgloseUnidadesConNombres(modData, esRetirado, esConvalidado, moduloNombre, configAula) {
  if (esRetirado) {
    return `<div class="col-12"><div class="alert alert-secondary text-center mb-0">Estudiante Retirado del Curso</div></div>`;
  }
  if (esConvalidado) {
    return `<div class="col-12"><div class="alert alert-primary text-center mb-0"><i class="bi bi-patch-check-fill me-1"></i> Módulo Convalidado Oficialmente</div></div>`;
  }
  if (!modData || !modData.unidades) {
    return `<div class="col-12"><div class="alert alert-warning text-center mb-0">Sin datos de unidades disponibles</div></div>`;
  }

  let html = "";
  for (const [uniNombre, cuestionarios] of Object.entries(modData.unidades)) {
    html += `
      <div class="col-md-6">
        <div class="card h-100 border-light bg-light shadow-sm">
          <div class="card-header bg-white fw-bold x-small text-uppercase text-primary py-2 border-bottom">
            ${uniNombre}
          </div>
          <div class="card-body p-2">
            <ul class="list-group list-group-flush x-small">
              ${cuestionarios.map((c, i) => {
                const nombreLimpio = obtenerYLimpiarNombreCuestionario(c, uniNombre, i, moduloNombre, configAula);
                
                // ASIGNACIÓN DE COLOR DEL BADGE SEGÚN EL ESTADO
                let badgeBg = "bg-warning text-dark"; // PENDIENTE por defecto
                if (c.estado === "REALIZADO" || c.estado === "APROBADO") {
                  badgeBg = "bg-success"; // Verde
                } else if (c.estado === "REPROBADO") {
                  badgeBg = "bg-danger"; // Rojo
                }

                return `
                  <li class="list-group-item bg-transparent d-flex justify-content-between align-items-center py-2 px-1 border-bottom-dashed">
                    <div class="me-2 cuestionario-item-nombre" title="${nombreLimpio}">
                      <strong>${nombreLimpio}</strong>
                    </div>
                    <div class="d-flex align-items-center gap-1 flex-shrink-0 ms-auto">
                      <span class="fw-bold me-1">${c.nota !== undefined ? c.nota : '-'}</span>
                      <span class="badge ${badgeBg}">${c.estado}</span>
                    </div>
                  </li>
                `;
              }).join("")}
            </ul>
          </div>
        </div>
      </div>
    `;
  }
  return html;
}

/* ---------- Formato WhatsApp ----------
 * Reglas: *negrita*, _cursiva_, ~tachado~, ```monospace```.
 * Los marcadores no pueden tocar espacios por dentro ("* texto *" no funciona)
 * y los nombres con * _ ~ ` rompen el formato, así que se limpian antes.
 */
export function limpiarWA(texto) {
  return String(texto ?? "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function negritaWA(texto) {
  const limpio = limpiarWA(texto);
  return limpio ? `*${limpio}*` : "";
}

export function italicaWA(texto) {
  const limpio = limpiarWA(texto);
  return limpio ? `_${limpio}_` : "";
}

/** Solo dígitos: el número de WhatsApp debe ir sin espacios ni guiones. */
function telefonoWA(telefono) {
  return String(telefono ?? "").replace(/\D/g, "");
}

/** Bloque de cierre para WhatsApp, con el mismo texto que la boleta y la esquela. */
export function bloqueCierreWA(configAula, moduloNombre) {
  if (getTipoBase() !== "tic") return "";
  const cierre = textoCierreDocumento(configAula, moduloNombre);
  if (!cierre) return "";
  const icono = cierre.vencido ? "🔒" : "⏳";
  return `${icono} ${negritaWA(cierre.titulo)}\n${italicaWA(cierre.detalle)}\n`;
}

/**
 * Genera un texto en Markdown con el desglose detallado de pendientes para pegar en chat
 */
/**
 * Aviso de cierre del módulo. Solo para bases TIC y aulas de tipo módulo.
 */
function renderizarAvisoCierre(configAula, moduloNombre) {
  if (getTipoBase() !== "tic") return "";
  const cierre = estadoCierre(configAula, moduloNombre);
  if (cierre.estado === "sin_fecha") return "";

  if (cierre.estado === "vencido") {
    return `
      <div class="aviso-cierre aviso-vencido mb-4">
        <i class="bi bi-lock-fill fs-4"></i>
        <div>
          <strong>Módulo cerrado</strong>
          <div class="small">${cierre.texto}</div>
        </div>
      </div>`;
  }

  const partes = cierre.texto.match(/Quedan (.+?) para/);
  return `
    <div class="aviso-cierre aviso-abierto mb-4">
      <div class="reloj-cierre"><i class="bi bi-alarm-fill"></i></div>
      <div>
        <strong>Cierre del módulo: ${formatearFechaHora(cierre.fecha)}</strong>
        <div class="small">Quedan <b>${partes ? partes[1] : ""}</b></div>
      </div>
    </div>`;
}

export function generarTextoReporteDetallado(estudiante, moduloNombre, porcentaje, detalles, esRetirado, esConvalidado, tipoAula, configAula) {
  const bloquesTotal = 10;
  const bloquesLlenos = Math.round((porcentaje / 100) * bloquesTotal);
  const barraAscii = "█".repeat(bloquesLlenos) + "░".repeat(bloquesTotal - bloquesLlenos);
  const terminoAula = tipoAula === "curso" ? "CURSO" : "MÓDULO";

  let msj = `📌 ${negritaWA("REPORTE ACADÉMICO INDIVIDUAL")}\n`;
  msj += `👤 ${negritaWA("Estudiante:")} ${limpiarWA(`${estudiante.nombre} ${estudiante.apellidos}`)}\n`;
  msj += `👥 ${negritaWA("Grupo:")} ${limpiarWA(formatearEtiquetaGrupo(estudiante.grupoInfo))}\n`;
  msj += `📘 ${negritaWA(terminoAula + ":")} ${limpiarWA(moduloNombre)}\n`;
  msj += `📊 ${negritaWA("Avance General:")} ${porcentaje}% [${barraAscii}]\n`;
  msj += bloqueCierreWA(configAula, moduloNombre);
  msj += `━━━━━━━━━━━━━━━━━━━━━━\n`;

  if (esRetirado) {
    msj += `⚠️ *ESTADO:* Estudiante en condición de RETIRADO.\n`;
  } else if (esConvalidado) {
    msj += `🎓 *ESTADO:* ${terminoAula} CONVALIDADO oficialmente.\n`;
  } else {
    const pendientes = detalles.filter(d => d.estado !== "REALIZADO" && d.estado !== "APROBADO" && d.estado !== "CONVALIDADO");
    
    if (pendientes.length > 0) {
      msj += `⚠️ ${negritaWA("ACTIVIDADES PENDIENTES / POR ENTREGAR:")} (${pendientes.length})\n`;
      pendientes.forEach(item => {
        const notaStr = item.nota !== undefined && item.nota !== null && Number(item.nota) > 0 ? ` (Nota: ${item.nota})` : "";
        msj += `❌ ${negritaWA(item.unidad + ":")} ${limpiarWA(item.nombre)}${notaStr} - [${item.estado}]\n`;
      });
      msj += `\n📢 ${negritaWA("INDICACIÓN:")} ${italicaWA("Por favor ingresar a la plataforma CAMPUS Virtual INATEC para realizar las actividades pendientes a la brevedad posible.")}\n`;
    } else {
      msj += `🎉 ${negritaWA("¡EXCELENTE TRABAJO!")} Has completado exitosamente todas las actividades de este ${terminoAula.toLowerCase()}.\n`;
    }
  }
  return msj;
}

/**
 * Renderiza el botón de WhatsApp Directo enviando el reporte formateado
 */
function renderizarBotonWhatsAppDirecto(telefono, textoReporte) {
  if (telefono) {
    const msjUrl = encodeURIComponent(textoReporte);
    return `
      <a href="https://wa.me/505${telefonoWA(telefono)}?text=${msjUrl}" target="_blank" class="btn btn-sm btn-outline-success">
        <i class="bi bi-whatsapp me-1"></i> WhatsApp Directo
      </a>
    `;
  } else {
    return `
      <button class="btn btn-sm btn-outline-secondary" disabled title="Sin número telefónico en DB Provisional">
        <i class="bi bi-whatsapp me-1"></i> Sin N° Registrado
      </button>
    `;
  }
}

/**
 * Captura la tarjeta individual (#area-captura-boleta) usando html2canvas
 */
function capturarBoletaComoImagen(estudiante) {
  const area = document.getElementById("area-captura-boleta");
  if (!area) return;

  html2canvas(area, { scale: 2, backgroundColor: "#ffffff" }).then((canvas) => {
    const link = document.createElement("a");
    const nomClean = `${estudiante.nombre}_${estudiante.apellidos}`.replace(/\s+/g, "_");
    link.download = `Boleta_${nomClean}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

/**
 * Genera y copia la lista de estudiantes filtrados para WhatsApp
 */
export function copiarListaWhatsAppGrupal(datosEstudiantes, moduloNombre, grupoSeleccionado, tipoEstado, opciones = {}) {
  let filtrados = datosEstudiantes;

  if (grupoSeleccionado && grupoSeleccionado !== "TODOS") {
    filtrados = filtrados.filter(est => est.grupoInfo && est.grupoInfo.etiquetaGrupo === grupoSeleccionado);
  }

  if (tipoEstado === "COMPLETADOS") {
    filtrados = filtrados.filter(est => {
      const mod = est.modulos ? est.modulos[moduloNombre] : null;
      return mod && mod.completado && est.estadoEstudiante !== "retirado";
    });
  } else if (tipoEstado === "PENDIENTES") {
    filtrados = filtrados.filter(est => {
      const mod = est.modulos ? est.modulos[moduloNombre] : null;
      return mod && !mod.completado && !mod.estaConvalidado && est.estadoEstudiante !== "retirado";
    });
  }

  if (filtrados.length === 0) {
    toast(`No hay estudiantes en el filtro: ${tipoEstado.toLowerCase()}`, "aviso");
    return;
  }

  const completados = tipoEstado === "COMPLETADOS";
  const titulo = completados ? "ESTUDIANTES COMPLETADOS" : "ESTUDIANTES PENDIENTES";

  let msj = `${completados ? "🎉" : "📋"} ${negritaWA(`${titulo} - ${moduloNombre}`)}\n`;
  const etiquetaGrupo = !grupoSeleccionado || grupoSeleccionado === "TODOS"
    ? "Todos los grupos"
    : opciones.etiquetaGrupo || grupoSeleccionado;
  msj += `👥 ${negritaWA("Grupo:")} ${limpiarWA(etiquetaGrupo)}\n`;
  msj += bloqueCierreWA(opciones.configAula, moduloNombre);
  msj += `━━━━━━━━━━━━━━━━━━━━━━\n`;

  filtrados.forEach((est, i) => {
    const icono = completados ? "✅" : "⏳";
    msj += `${icono} ${i + 1}. ${limpiarWA(`${est.nombre} ${est.apellidos}`)}\n`;
  });

  msj += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msj += completados
    ? `${italicaWA("¡Felicidades por su excelente trabajo y cumplimiento!")}\n`
    : `${italicaWA("Por favor ponerse al día lo antes posible en el CAMPUS Virtual.")}\n`;

  copiarTextoPortapapeles(
    msj,
    opciones.elemento,
    `Lista de ${completados ? "completados" : "pendientes"} copiada (${filtrados.length})`,
  );
}

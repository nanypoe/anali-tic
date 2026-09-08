/* js/ui/modalRenderer.js */

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
    tipoAula
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
          <span class="badge bg-light text-dark border"><i class="bi bi-people me-1"></i>${estudiante.grupoInfo?.etiquetaGrupo || 'Sin Grupo'}</span>
        </div>
        <div class="text-end">
          <div class="mb-2">${estadoBadgeHTML}</div>
          <small class="text-muted fw-bold d-block">${etiquetaTipo}</small>
          <span class="fw-bold text-uppercase text-secondary">${moduloNombre}</span>
        </div>
      </div>

      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <small class="fw-bold text-muted">Avance del Módulo/Curso</small>
          <small class="fw-bold text-primary">${porcentaje}%</small>
        </div>
        <div class="progress" style="height: 10px;">
          <div class="progress-bar ${porcentaje === 100 ? 'bg-success' : 'bg-primary'}" role="progressbar" style="width: ${porcentaje}%"></div>
        </div>
      </div>

      <h6 class="fw-bold text-secondary mb-3"><i class="bi bi-journal-text me-1"></i>${etiquetaDetalle}</h6>
      <div class="row g-3 mb-3">
        ${renderizarDesgloseUnidadesConNombres(modData, esRetirado, esConvalidado, moduloNombre, configAula)}
      </div>
    </div>

    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mt-3 pt-3 border-top">
      <div>
        ${renderizarBotonWhatsAppDirecto(telefono, textoReporteDetallado)}
        <button class="btn btn-sm btn-outline-secondary" id="btn-copiar-reporte-txt">
          <i class="bi bi-clipboard-check me-1"></i> Copiar Reporte
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
    btnCopiar.onclick = () => {
      navigator.clipboard.writeText(textoReporteDetallado).then(() => {
        alert("¡Reporte detallado copiado al portapapeles!");
      });
    };
  }

  const btnCapturar = modalBody.querySelector("#btn-capturar-boleta");
  if (btnCapturar) {
    btnCapturar.onclick = () => capturarBoletaComoImagen(estudiante);
  }

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
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

/**
 * Genera un texto en Markdown con el desglose detallado de pendientes para pegar en chat
 */
function generarTextoReporteDetallado(estudiante, moduloNombre, porcentaje, detalles, esRetirado, esConvalidado, tipoAula) {
  const bloquesTotal = 10;
  const bloquesLlenos = Math.round((porcentaje / 100) * bloquesTotal);
  const barraAscii = "█".repeat(bloquesLlenos) + "░".repeat(bloquesTotal - bloquesLlenos);
  const terminoAula = tipoAula === "curso" ? "CURSO" : "MÓDULO";

  let msj = `📌 *REPORTE ACADÉMICO INDIVIDUAL*\n`;
  msj += `👤 *Estudiante:* ${estudiante.nombre} ${estudiante.apellidos}\n`;
  msj += `👥 *Grupo:* ${estudiante.grupoInfo?.etiquetaGrupo || 'Sin Grupo'}\n`;
  msj += `📘 *${terminoAula}:* ${moduloNombre}\n`;
  msj += `📊 *Avance General:* ${porcentaje}% [${barraAscii}]\n`;
  msj += `-----------------------------------\n`;

  if (esRetirado) {
    msj += `⚠️ *ESTADO:* Estudiante en condición de RETIRADO.\n`;
  } else if (esConvalidado) {
    msj += `🎓 *ESTADO:* ${terminoAula} CONVALIDADO oficialmente.\n`;
  } else {
    const pendientes = detalles.filter(d => d.estado !== "REALIZADO" && d.estado !== "APROBADO" && d.estado !== "CONVALIDADO");
    
    if (pendientes.length > 0) {
      msj += `⚠️ *ACTIVIDADES PENDIENTES / POR ENTREGAR:* (${pendientes.length})\n`;
      pendientes.forEach(item => {
        const notaStr = item.nota !== undefined && item.nota !== null && item.nota > 0 ? ` (Nota: ${item.nota})` : '';
        msj += ` ❌ *${item.unidad}:* ${item.nombre}${notaStr} - [${item.estado}]\n`;
      });
      msj += `\n📢 *INDICACIÓN:* _Por favor ingresar a la plataforma CAMPUS Virtual INATEC para realizar las actividades pendientes a la brevedad posible._\n`;
    } else {
      msj += `🎉 *¡EXCELENTE TRABAJO!* Has completado exitosamente todas las actividades de este ${terminoAula.toLowerCase()}.\n`;
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
      <a href="https://wa.me/505${telefono}?text=${msjUrl}" target="_blank" class="btn btn-sm btn-outline-success">
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
export function copiarListaWhatsAppGrupal(datosEstudiantes, moduloNombre, grupoSeleccionado, tipoEstado) {
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
    alert(`No hay estudiantes registrados con el filtro: ${tipoEstado}`);
    return;
  }

  const emojiHeader = tipoEstado === "COMPLETADOS" ? "🎉" : "⚠️";
  const emojiBullet = tipoEstado === "COMPLETADOS" ? "✅" : "⚠️";
  const titulo = tipoEstado === "COMPLETADOS" ? "ESTUDIANTES COMPLETADOS" : "ESTUDIANTES PENDIENTES";

  let msj = `*${titulo} - MÓDULO/CURSO: ${moduloNombre}* ${emojiHeader}\n`;
  msj += `👥 Grupo: ${grupoSeleccionado}\n`;
  msj += `--------------------------------\n`;

  filtrados.forEach(est => {
    msj += `${emojiBullet} ${est.nombre} ${est.apellidos}\n`;
  });

  msj += `--------------------------------\n`;
  msj += tipoEstado === "PENDIENTES" 
    ? `_Por favor ponerse al día lo antes posible en el CAMPUS Virtual._\n` 
    : `_¡Felicidades por su excelente trabajo y cumplimiento!_\n`;

  navigator.clipboard.writeText(msj).then(() => {
    alert(`¡Lista de ${tipoEstado} copiada al portapapeles!`);
  });
}

/**
 * Despliega el modal con las credenciales de acceso al CAMPUS
 */
export function mostrarModalCredenciales(estudiante) {
  const modalEl = document.getElementById("modalCredenciales");
  if (!modalEl) return;

  const modalBody = modalEl.querySelector(".modal-body");
  const datos = estudiante.datosContacto || {};
  const tieneCredenciales = datos.usuario && datos.contrasena;

  if (tieneCredenciales) {
    modalBody.innerHTML = `
      <div class="text-center mb-3">
        <i class="bi bi-shield-lock text-primary display-4"></i>
        <h5 class="fw-bold mt-2">${estudiante.nombre} ${estudiante.apellidos}</h5>
        <span class="badge bg-light text-dark border">${estudiante.correo || 'Sin Correo'}</span>
      </div>
      <div class="card bg-light border-0 p-3 mb-3">
        <div class="mb-2">
          <small class="text-muted d-block fw-bold">USUARIO CAMPUS:</small>
          <div class="input-group">
            <input type="text" readonly class="form-control form-control-sm bg-white" value="${datos.usuario}">
            <button class="btn btn-sm btn-outline-primary" onclick="navigator.clipboard.writeText('${datos.usuario}')">
              <i class="bi bi-clipboard"></i>
            </button>
          </div>
        </div>
        <div>
          <small class="text-muted d-block fw-bold">CONTRASEÑA:</small>
          <div class="input-group">
            <input type="text" readonly class="form-control form-control-sm bg-white" value="${datos.contrasena}">
            <button class="btn btn-sm btn-outline-primary" onclick="navigator.clipboard.writeText('${datos.contrasena}')">
              <i class="bi bi-clipboard"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    modalBody.innerHTML = `
      <div class="text-center py-3">
        <i class="bi bi-exclamation-triangle text-warning display-4"></i>
        <h6 class="fw-bold mt-3 text-dark">Credenciales No Disponibles</h6>
        <p class="text-muted small mb-0 px-3">
          ℹ️ Las credenciales de acceso al CAMPUS no están disponibles en la <strong>Base de Datos Provisional</strong> cargada.
        </p>
      </div>
    `;
  }

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}
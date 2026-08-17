/* js/ui/tableRenderer.js */

import { 
  mostrarModalBoletaIndividual, 
  copiarListaWhatsAppGrupal, 
  mostrarModalCredenciales 
} from "./modalRenderer.js";

let modoReporte = false;
let moduloActivo = "";
let grupoActivo = "TODOS";
let filtroEstadoActivo = "TODOS";

export function inicializarControlesTabla(datosEstudiantes, configAula) {
  const modulosNombres = Object.keys(configAula.modulos);
  moduloActivo = modulosNombres[0];

  // 1. Renderizar Píldoras de Módulos
  renderizarPildorasModulos(modulosNombres, datosEstudiantes, configAula);

  // 2. Extraer y popular Selector de Grupos dinámicamente
  popularSelectorGrupos(datosEstudiantes, configAula);

  // 3. Configurar Píldoras de Filtro de Estado
  configurarFiltrosEstado(datosEstudiantes, configAula);

  // 4. Configurar Buscador y Captura de Pantalla
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.oninput = () => ejecutarRenderizado(datosEstudiantes, configAula);
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
      ejecutarRenderizado(datosEstudiantes, configAula);
    };
  }

  // Renderizado inicial
  ejecutarRenderizado(datosEstudiantes, configAula);
}

function renderizarPildorasModulos(modulos, datosEstudiantes, configAula) {
  const container = document.getElementById("pills-modulos");
  if (!container) return;

  container.innerHTML = modulos
    .map(
      (mod, idx) => `
    <button class="btn-pill ${idx === 0 ? "active" : ""}" data-modulo="${mod}">
      <i class="bi bi-journal-bookmark"></i> ${mod}
    </button>
  `
    )
    .join("");

  container.querySelectorAll(".btn-pill").forEach((btn) => {
    btn.onclick = () => {
      container
        .querySelectorAll(".btn-pill")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      moduloActivo = btn.getAttribute("data-modulo");
      ejecutarRenderizado(datosEstudiantes, configAula);
    };
  });
}

function popularSelectorGrupos(datosEstudiantes, configAula) {
  const grupoSelect = document.getElementById("grupo-selector");
  if (!grupoSelect) return;

  const gruposSet = new Set();
  datosEstudiantes.forEach((est) => {
    if (est.grupoInfo && est.grupoInfo.etiquetaGrupo) {
      gruposSet.add(est.grupoInfo.etiquetaGrupo);
    }
  });

  let optionsHTML = `<option value="TODOS">Todos los grupos</option>`;
  Array.from(gruposSet)
    .sort()
    .forEach((grp) => {
      if (grp !== "Sin Grupo Asignado") {
        optionsHTML += `<option value="${grp}">${grp}</option>`;
      }
    });

  grupoSelect.innerHTML = optionsHTML;
  grupoSelect.onchange = (e) => {
    grupoActivo = e.target.value;
    ejecutarRenderizado(datosEstudiantes, configAula);
  };
}

function configurarFiltrosEstado(datosEstudiantes, configAula) {
  const container = document.getElementById("pills-estados");
  if (!container) return;

  container.querySelectorAll(".btn-pill").forEach((btn) => {
    btn.onclick = (e) => {
      // Si el clic es sobre el badge de conteo (Completados/Pendientes), copia a WhatsApp
      const estadoAttr = btn.getAttribute("data-estado");
      if (e.target.classList.contains("badge") && (estadoAttr === "COMPLETADO" || estadoAttr === "PENDIENTE")) {
        const tipoWA = estadoAttr === "COMPLETADO" ? "COMPLETADOS" : "PENDIENTES";
        copiarListaWhatsAppGrupal(datosEstudiantes, moduloActivo, grupoActivo, tipoWA);
        return;
      }

      container.querySelectorAll(".btn-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      filtroEstadoActivo = estadoAttr;
      ejecutarRenderizado(datosEstudiantes, configAula);
    };
  });
}

function ejecutarRenderizado(datosEstudiantes, configAula) {
  const searchInput = document.getElementById("search-input");
  const termino = searchInput ? searchInput.value.toLowerCase() : "";
  const btnCaptura = document.getElementById("btn-capturar-tabla");

  // 1. Filtrado por Grupo
  let filtrados =
    grupoActivo === "TODOS"
      ? datosEstudiantes
      : datosEstudiantes.filter(
          (est) => est.grupoInfo && est.grupoInfo.etiquetaGrupo === grupoActivo
        );

  if (btnCaptura) {
    btnCaptura.onclick = () => capturarTablaComoImagen(filtrados);
  }

  // 2. Filtrado por Búsqueda
  if (termino) {
    filtrados = filtrados.filter((est) =>
      `${est.nombre} ${est.apellidos} ${est.correo}`
        .toLowerCase()
        .includes(termino)
    );
  }

  // 3. Recalcular Métricas Dinámicas por Selección
  actualizarBadgesMetricas(filtrados);

  // 4. Filtrado por Estado
  if (filtroEstadoActivo !== "TODOS") {
    filtrados = filtrados.filter((est) => {
      const mod = est.modulos ? est.modulos[moduloActivo] : null;
      if (!mod) return false;
      if (filtroEstadoActivo === "RETIRADO") return est.estadoEstudiante === "retirado";
      if (filtroEstadoActivo === "CONVALIDADO") return mod.estaConvalidado;
      if (filtroEstadoActivo === "COMPLETADO") return mod.completado && !mod.estaConvalidado;
      if (filtroEstadoActivo === "PENDIENTE") return !mod.completado && !mod.estaConvalidado && est.estadoEstudiante !== "retirado";
      return true;
    });
  }

  filtrados.sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  );

  renderizarTabla(filtrados, configAula);
}

function actualizarBadgesMetricas(estudiantesVisibles) {
  let tod = estudiantesVisibles.length;
  let comp = 0, prog = 0, conv = 0, ret = 0;

  estudiantesVisibles.forEach((est) => {
    const mod = est.modulos ? est.modulos[moduloActivo] : null;
    if (!mod) return;
    if (est.estadoEstudiante === "retirado") ret++;
    else if (mod.estaConvalidado) conv++;
    else if (mod.completado) comp++;
    else prog++;
  });

  const setBadge = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setBadge("badge-cnt-todos", tod);
  setBadge("badge-cnt-completados", comp);
  setBadge("badge-cnt-pendientes", prog);
  setBadge("badge-cnt-convalidados", conv);
  setBadge("badge-cnt-retirados", ret);
}

export function renderizarTabla(datos, configAula) {
  const tbody = document.getElementById("tabla-body");
  const head = document.getElementById("tabla-head");

  if (!tbody || !head) return;

  tbody.innerHTML = "";
  head.innerHTML = "";

  if (!datos || datos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="100%" class="text-center py-4 text-muted">No se encontraron registros para este filtro</td></tr>`;
    return;
  }

  // Encabezados
  let filaUni = `<tr>
    <th rowspan="2" class="align-middle text-start px-3 col-estudiante">Estudiante</th>
    <th rowspan="2" class="align-middle text-center col-acciones" style="width: 50px;">Credenciales</th>`;
  let filaCues = `<tr>`;

  const unidadesConfig = configAula.modulos[moduloActivo];
  let totalCuestionariosModulo = 0;

  for (let uni in unidadesConfig) {
    const cuestionarios = unidadesConfig[uni];
    totalCuestionariosModulo += cuestionarios.length;
    filaUni += `<th colspan="${cuestionarios.length}" class="bg-primary text-white p-1 text-center" style="font-size: 0.68rem">${uni}</th>`;
    cuestionarios.forEach((c, i) => {
      filaCues += `<th title="${c}" class="text-center" style="font-size: 0.65rem; min-width: 42px">C${i + 1}</th>`;
    });
  }

  filaUni += `<th rowspan="2" class="align-middle text-center">Estado</th></tr>`;
  filaCues += `</tr>`;
  head.innerHTML = filaUni + filaCues;

  // Filas
  datos.forEach((est) => {
    const tr = document.createElement("tr");
    tr.className = "row-estudiante";
    tr.style.cursor = "pointer";

    const modData = est.modulos ? est.modulos[moduloActivo] : null;
    const esRetirado = est.estadoEstudiante === "retirado";
    const esConvalidado = modData && modData.estaConvalidado;

    let filaHTML = `
      <td class="text-start px-3 py-2">
        <div class="fw-semibold text-uppercase small text-primary col-estudiante">${est.nombre} ${est.apellidos}</div>
      </td>
      <td class="text-center align-middle col-acciones" onclick="event.stopPropagation()">
        <button class="btn btn-xs btn-outline-secondary btn-credenciales" title="Ver Credenciales CAMPUS">
          <i class="bi bi-key-fill"></i>
        </button>
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
          let color = c.estado === "APROBADO" ? "#95f7c0" : c.estado === "REPROBADO" ? "#f3a2a2" : "#f3e2a3";
          let contenido = modoReporte ? `<span style="font-size: 9px">${c.estado}</span>` : c.nota;
          filaHTML += `<td class="text-center fw-bold align-middle" style="background-color: ${color}; font-size: 0.72rem; border: 1px solid #dee2e6">${contenido}</td>`;
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

    filaHTML += `<td class="text-center align-middle"><span class="badge ${badgeClase}">${textoEstado}</span></td>`;
    tr.innerHTML = filaHTML;

    // Evento de apertura del modal pasando configAula
    tr.onclick = () => mostrarModalBoletaIndividual(est, moduloActivo, configAula);

    // Evento exclusivo del botón credenciales
    const btnCred = tr.querySelector(".btn-credenciales");
    if (btnCred) {
      btnCred.onclick = (e) => {
        e.stopPropagation();
        mostrarModalCredenciales(est);
      };
    }

    tbody.appendChild(tr);
  });
}

function capturarTablaComoImagen(datosEstudiantesVisibles = []) {
  const tabla = document.getElementById("tabla-resultados");
  const btn = document.getElementById("btn-capturar-tabla");
  const grupoSelect = document.getElementById("grupo-selector");
  if (!tabla || !btn) return;

  const areaCaptura = tabla.parentElement;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Generando...`;
  btn.disabled = true;

  // 1. Guardar estilos originales para restaurar después de la captura
  const estiloOriginalTablaWidth = tabla ? tabla.style.width : "";
  const estiloOriginalContenedorWidth = areaCaptura.style.width;
  const estiloOriginalDisplay = areaCaptura.style.display;

  // 2. Ocultar temporalmente la columna "Acciones" (cabecera y celdas)
  const elementosAcciones = areaCaptura.querySelectorAll(".col-acciones");
  elementosAcciones.forEach((el) => {
    el.dataset.displayOriginal = el.style.display;
    el.style.display = "none";
  });

  // 3. Reajustar el contenedor para que la imagen se adecue al contenido real
  if (tabla) tabla.style.width = "max-content";
  areaCaptura.style.width = "fit-content";
  areaCaptura.style.display = "inline-block";

  // Obtener nombre de grupo y turno
  let textoGrupoSeleccionado = "TODOS_LOS_GRUPOS";
  if (grupoSelect && grupoSelect.selectedIndex >= 0) {
    textoGrupoSeleccionado = grupoSelect.options[grupoSelect.selectedIndex].text.trim();
  }

  let turno = "matutino";
  if (datosEstudiantesVisibles && datosEstudiantesVisibles.length > 0) {
    const primerEst = datosEstudiantesVisibles[0];
    if (primerEst.grupoInfo && primerEst.grupoInfo.turno) {
      turno = primerEst.grupoInfo.turno;
    } else if (primerEst.turno) {
      turno = primerEst.turno;
    }
  }

  // Insertar encabezado temporal decorativo para el PNG
  const headerTemporal = document.createElement("div");
  headerTemporal.id = "encabezado-captura-temp";
  headerTemporal.style.cssText = `
    padding: 15px 20px;
    margin-bottom: 15px;
    background-color: #ffffff;
    border-bottom: 3px solid #0d6efd;
    width: 100%;
    box-sizing: border-box;
  `;
  headerTemporal.innerHTML = `
    <h2 style="margin: 0; font-size: 1.4rem; font-weight: bold; color: #0d6efd; text-transform: uppercase;">
      ${textoGrupoSeleccionado}
    </h2>
    <h5 style="margin: 5px 0 0 0; font-size: 1rem; color: #6c757d; text-transform: capitalize;">
      Turno: ${turno} | Módulo: ${moduloActivo}
    </h5>
  `;

  areaCaptura.insertBefore(headerTemporal, tabla);

  const hoy = new Date();
  const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const horaStr = `${String(hoy.getHours()).padStart(2, "0")}:${String(hoy.getMinutes()).padStart(2, "0")}`;

  const grupoClean = textoGrupoSeleccionado.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  const turnoClean = turno.toLowerCase().replace(/\s+/g, "_");
  const nombreArchivo = `${fechaStr}_${horaStr}_Avance_${grupoClean}_${turnoClean}.png`;

  // 4. Capturar con html2canvas
  html2canvas(areaCaptura, { scale: 3, useCORS: true, backgroundColor: "#ffffff" })
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
    .finally(() => {
      // 5. RESTAURAR la interfaz a su estado original
      elementosAcciones.forEach((el) => {
        el.style.display = el.dataset.displayOriginal || "";
        delete el.dataset.displayOriginal;
      });

      if (tabla) tabla.style.width = estiloOriginalTablaWidth;
      areaCaptura.style.width = estiloOriginalContenedorWidth;
      areaCaptura.style.display = estiloOriginalDisplay;

      if (headerTemporal && headerTemporal.parentNode) {
        headerTemporal.parentNode.removeChild(headerTemporal);
      }

      btn.innerHTML = originalText;
      btn.disabled = false;
    });
}
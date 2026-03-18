const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const statusArea = document.getElementById("status-area");
const welcomeHeader = document.getElementById("welcome-header");
const uploadContainer = document.getElementById("upload-container");
const navActions = document.getElementById("nav-actions");
const loaderOverlay = document.getElementById("loader-overlay");
const moduleSelector = document.getElementById("module-selector");

const FECHAS_CORTE = {
  "Adaptación al Cambio Climático": "2026-04-13",
  "Orientación Laboral": "2026-06-14",
  "Historia e Identidad Nacional": "2026-07-04",
  "Identidad Cultural": "2026-09-13",
  "Cultura de Paz": "2026-09-13",
};

const ORDEN_MODULOS = [
  "Adaptación al Cambio Climático",
  "Orientación Laboral",
  "Historia e Identidad Nacional",
  "Identidad Cultural",
  "Cultura de Paz",
];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

let modoReporte = false;
window.datosProcesados = [];

// --- CONFIGURACIÓN DE MÓDULOS ---
const CONFIG_MODULOS = {
  "Historia e Identidad Nacional": {
    "Unidad 1": [
      "Cuestionario:Cuestionario UD1: Impacto de la invasión europea, resistencia popular e independencia de Centroamérica y Nicaragua (Real)",
      "Cuestionario:Cuestionario UD1: La guerra nacional y la influencia británica en el caribe nicaragüense (Real)",
    ],
    "Unidad 2": [
      "Cuestionario:Cuestionario UD2: Resistencia, soberanía y lucha contra la dictadura somocista (Real)",
      "Cuestionario:Cuestionario UD2: Programa histórico y la Revolución Popular Sandinista (Real)",
      "Cuestionario:Cuestionario UD2: Estatutos de Autonomía de la Costa Caribe (Real)",
      "Cuestionario:Cuestionario UD2: Políticas de los gobiernos neoliberales (Real)",
      "Cuestionario:Cuestionario UD2: Transformaciones del Gobierno de Reconciliación y Unidad Nacional en un Contexto Global Cambiante (Real)",
    ],
    "Unidad 3": [
      "Cuestionario:Cuestionario UD3: El Patrimonio Nacional Nicaragüense (Real)",
    ],
  },
  "Adaptación al Cambio Climático": {
    "Unidad 1": [
      "Cuestionario:Cuestionario UD1: Gestión ambiental de la contaminación y cambio climático. (Real)",
    ],
    "Unidad 2": [
      "Cuestionario:Cuestionario UD2: Marco legal Nacional de los Sistemas de Gestión Ambiental. (Real)",
    ],
    "Unidad 3": [
      "Cuestionario:Cuestionario UD3: Prácticas ambientales en la adaptación al cambio climático (Real)",
    ],
    "Unidad 4": [
      "Cuestionario:Cuestionario UD4: Gestión de riesgos de desastres ante multiamenazas (Real)",
    ],
  },
  "Orientación Laboral": {
    "Unidad 1": [
      "Cuestionario:Cuestionario UDI: Generalidades de la Orientación Laboral. (Real)",
    ],
    "Unidad 2": ["Cuestionario:Cuestionario UDII: Marco Legal Laboral (Real)"],
    "Unidad 3": [
      "Cuestionario:Cuestionario UDIII: Requerimientos en la búsqueda de empleo. (Real)",
    ],
    "Unidad 4": [
      "Cuestionario:Cuestionario 1 UDIV: Requerimientos en la entrevista laboral y capacitaciones técnica en el área de trabajo (Real)",
      "Cuestionario:Cuestionario 2 UDIV: Educación en Valores (Real)",
    ],
  },
  "Identidad Cultural": {
    "Unidad 1": [
      "Cuestionario:Cuestionario UD1: Conceptos de identidad cultural. (Real)",
      "Cuestionario:Cuestionario UD1: Importancia identidad cultural (Real)",
    ],
    "Unidad 2": [
      "Cuestionario:Cuestionario 1 de la UD2 (Real)",
      "Cuestionario:Cuestionario 2 de la UD2 (Real)",
    ],
    "Unidad 3": [
      "Cuestionario:Cuestionario 1 de la UD3 (Real)",
      "Cuestionario:Cuestionario 2 de la UD3 (Real)",
    ],
  },
  "Cultura de Paz": {
    "Unidad 1": [
      "Cuestionario:Cuestionario UI: Tema 2 Ley 985 Cultura de paz (Real)",
      "Cuestionario:Cuestionario UI: Tema 3 Rol del ciudadano en la construcción de una cultura de paz (Real)",
    ],
    "Unidad 2": [
      "Cuestionario:Cuestionario UII: Tema2 Habilidades Socioemocionales (Real)",
      "Cuestionario:Cuestionario UII: Tema 3 Tipos de Valores (Real)",
    ],
    "Unidad 3": [
      "Cuestionario:Cuestionario UIII: Tema 2 Principios y Valores (Real)",
      "Cuestionario:Cuestionario UIII: Tema 3 Fundamentos del Código de conducta (Real)",
    ],
  },
};

// --- INICIALIZACIÓN ---
function inicializarSelector() {
  moduleSelector.innerHTML = "";
  Object.keys(CONFIG_MODULOS).forEach((mod) => {
    let opt = document.createElement("option");
    opt.value = mod;
    opt.textContent = mod;
    moduleSelector.appendChild(opt);
  });
}
inicializarSelector();

// --- EVENTOS ---
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drop-active");
});
dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("drop-active"),
);
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
moduleSelector.addEventListener("change", () =>
  renderizarTabla(window.datosProcesados),
);

document.getElementById("search-input").addEventListener("input", (e) => {
  const termino = e.target.value.toLowerCase();
  const filtrados = window.datosProcesados.filter((est) =>
    `${est.nombre} ${est.apellidos}`.toLowerCase().includes(termino),
  );
  renderizarTabla(filtrados);
});

document
  .getElementById("btn-modo-reporte")
  .addEventListener("click", function () {
    modoReporte = !modoReporte;
    this.innerText = modoReporte
      ? "Mostrar Calificaciones"
      : "Ocultar Calificaciones";
    this.classList.toggle("btn-dark");
    this.classList.toggle("btn-primary");
    renderizarTabla(window.datosProcesados);
  });

function handleFile(file) {
  if (!file) return;
  loaderOverlay.style.display = "flex";

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const jsonData = XLSX.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]],
      );

      if (jsonData.length === 0 || !jsonData[0].hasOwnProperty("Nombre")) {
        loaderOverlay.style.display = "none";
        Swal.fire({
          icon: "error",
          title: "Archivo no reconocido",
          text: "El formato no es válido. Asegúrate de exportar el reporte de calificaciones desde el CAMPUS.",
          confirmButtonColor: "#0d6efd",
        });
        return;
      }

      let resultados = jsonData.map((est) => analizarEstudiante(est));
      resultados.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      window.datosProcesados = resultados;

      setTimeout(() => {
        loaderOverlay.style.display = "none";
        uploadContainer.classList.add("d-none");
        navActions.classList.remove("d-none");
        statusArea.classList.remove("d-none");
        renderizarTabla(resultados);
      }, 1200);
    } catch (error) {
      console.error(error);
      loaderOverlay.style.display = "none";
      alert("Error al procesar el archivo.");
    }
  };
  reader.readAsArrayBuffer(file);
}

function analizarEstudiante(est) {
  let nombreStr = est["Nombre"] || "Sin nombre";
  let apellidoStr = est["Apellido(s)"] || "";
  let analisis = { nombre: nombreStr, apellidos: apellidoStr, modulos: {} };

  for (let modNombre in CONFIG_MODULOS) {
    let modCompletado = true;
    let unidades = {};
    for (let uni in CONFIG_MODULOS[modNombre]) {
      let items = CONFIG_MODULOS[modNombre][uni].map((c) => {
        let notaRaw = est[c];
        let nota = notaRaw === "-" || !notaRaw ? 0 : parseFloat(notaRaw);
        if (nota < 60) modCompletado = false;
        return {
          nota,
          estado:
            nota >= 60 ? "APROBADO" : nota > 0 ? "REPROBADO" : "PENDIENTE",
        };
      });
      unidades[uni] = items;
    }
    analisis.modulos[modNombre] = { completado: modCompletado, unidades };
  }
  return analisis;
}

function renderizarTabla(datos) {
  const tbody = document.getElementById("tabla-body");
  const head = document.getElementById("tabla-head");
  const modSeleccionado = moduleSelector.value;

  tbody.innerHTML = "";
  head.innerHTML = "";

  if (datos.length === 0) return;

  // Fila 1: Unidades | Fila 2: Cuestionarios
  let filaUni = `<tr><th rowspan="2" class="align-middle">Estudiante</th>`;
  let filaCues = `<tr>`;

  const unidades = CONFIG_MODULOS[modSeleccionado];
  for (let uni in unidades) {
    filaUni += `<th colspan="${unidades[uni].length}" class="bg-primary text-white p-1" style="font-size: 0.6rem">${uni}</th>`;
    unidades[uni].forEach((c, i) => {
      filaCues += `<th title="${c}" style="font-size: 0.55rem; min-width: 35px">C${i + 1}</th>`;
    });
  }
  filaUni += `<th rowspan="2" class="align-middle">Estado</th><th rowspan="2" class="align-middle">Acción</th></tr>`;
  filaCues += `</tr>`;

  head.innerHTML = filaUni + filaCues;

  let comp = 0,
    pend = 0;

  let htmlFinal = "";

  datos.forEach((est) => {
    const modData = est.modulos[modSeleccionado];
    if (modData.completado) comp++;
    else pend++;

    let fila = `<tr><td><div class="nombre-estudiante text-uppercase">${est.nombre} ${est.apellidos}</div></td>`;

    for (let uni in modData.unidades) {
      modData.unidades[uni].forEach((c) => {
        let color =
          c.estado === "APROBADO"
            ? "#95f7c0"
            : c.estado === "REPROBADO"
              ? "#f3a2a2"
              : "#f3e2a3";
        let contenido = modoReporte
          ? `<span style="font-size: 8px">${c.estado}</span>`
          : c.nota;
        fila += `<td class="text-center fw-bold" style="background-color: ${color}; font-size: 0.7rem; border: 1px solid #eee">${contenido}</td>`;
      });
    }

    const clase = modData.completado ? "badge-completo" : "badge-pendiente";
    const globalIndex = window.datosProcesados.indexOf(est);

    fila += `<td class="text-center"><span class="badge-status ${clase}">${modData.completado ? "COMPLETO" : "PENDIENTE"}</span></td>
                 <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary fw-bold" style="font-size: 0.65rem" onclick="mostrarReporteIndividual(${globalIndex})">REPORTE</button>
                 </td></tr>`;
    htmlFinal += fila;
  });
  tbody.innerHTML = htmlFinal;

  document.getElementById("count-completados").innerText = comp;
  document.getElementById("count-pendientes").innerText = pend;
}

// --- FUNCIÓN PARA EXPORTAR COMO IMAGEN ---//
document
  .getElementById("btn-exportar-img")
  .addEventListener("click", function () {
    const tablaContenedor = document.getElementById("status-area");
    const btn = this;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⌛...";
    btn.disabled = true;

    html2canvas(tablaContenedor, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#f8f9fa",
      onclone: (clonedDoc) => {
        // 1. Ocultar la fila que contiene el Buscador y el Selector de Módulo
        const controles = clonedDoc.querySelector(".card-header .row.g-2");
        if (controles) {
          controles.style.setProperty("display", "none", "important");
        }

        // 2. Ocultar la columna de botones "REPORTE" de la tabla para que se vea más limpia
        const botonesReporte = clonedDoc.querySelectorAll(
          "td .btn, th:last-child",
        );
        botonesReporte.forEach((el) => (el.style.display = "none"));

        // 3. Ajuste: Asegurarnos de que los contadores (Completados/Pendientes) sí se vean
        const stats = clonedDoc.getElementById("stats-summary");
        if (stats) stats.style.marginBottom = "20px";
      },
    }).then((canvas) => {
      const link = document.createElement("a");
      const fecha = new Date().toLocaleDateString().replace(/\//g, "-");
      const modulo = document.getElementById("module-selector").value;

      link.download = `Avance_${modulo}_${fecha}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      btn.innerHTML = originalText;
      btn.disabled = false;
    });
  });

// Función para calcular días restantes
function obtenerDiasRestantes(modulo) {
  const fechaFin = new Date(FECHAS_CORTE[modulo]);
  const hoy = new Date();
  const diferencia = fechaFin - hoy;
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

// Función principal del reporte
function mostrarReporteIndividual(estudianteIndex) {
  const est = window.datosProcesados[estudianteIndex];
  const modSeleccionado = document.getElementById("module-selector").value;
  const modData = est.modulos[modSeleccionado];
  const dias = obtenerDiasRestantes(modSeleccionado);
  const fechaCierreFormateada = formatearFechaLarga(
    FECHAS_CORTE[modSeleccionado],
  );

  let aprobados = 0,
    total = 0;
  for (let uni in modData.unidades) {
    modData.unidades[uni].forEach((c) => {
      total++;
      if (c.nota >= 60) aprobados++;
    });
  }

  let html = `
    <div class="boleta-recibo p-4 bg-white">
        <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <div class="text-start">
                <h6 class="fw-bold mb-0">Centro Tecnológico - Che Guevara, Somoto</h6>
                <small class="text-muted">Reporte de Avance de Módulo Transversal</small>
            </div>
            <img src="logo-inatec.jpg" alt="Logo" style="height: 50px;">
        </div>

        <div class="mb-4">
            <h5 id="nombre-estudiante-reporte" class="text-primary fw-bold text-uppercase mb-1">${est.nombre} ${est.apellidos}</h5>
            <p class="mb-2"><strong>Módulo:</strong> <span class="fw-bold text-dark">${modSeleccionado}</span></p>
            <div class="p-3 bg-light rounded-3 border-start border-4 border-primary">
                <p class="mb-0 small">
                    Has aprobado <strong>${aprobados}</strong> de <strong>${total}</strong> actividades. 
                    ${
                      aprobados === total
                        ? "¡Felicidades! Has finalizado este módulo con éxito."
                        : `Como aún no has finalizado, te recordamos que la fecha de cierre es el día <strong>${fechaCierreFormateada}.<strong> Te quedan <strong>${dias} días</strong> para completarlo.`
                    }
                </p>
            </div>
        </div>

        <div class="desglose-unidades">
            ${Object.keys(modData.unidades)
              .map(
                (uniKey) => `
                <div class="mb-3">
                    <h6 class="fw-bold text-secondary border-bottom pb-1" style="font-size: 0.8rem">${uniKey}</h6>
                    ${modData.unidades[uniKey]
                      .map((c, idx) => {
                        let color =
                          c.nota >= 60
                            ? "text-success"
                            : c.nota > 0
                              ? "text-danger"
                              : "text-warning";
                        let msj = "";
                        if (c.nota >= 60)
                          msj = "¡Cuestionario aprobado con éxito!";
                        else if (c.nota > 0)
                          msj =
                            "Has reprobado. Verifica que no hayas agotado tus 3 intentos. De ser así el caso contacta a tu docente TIC.";
                        else
                          msj =
                            "Aún no has realizado esta actividad. Es posible que no la hayas iniciado o algo te detiene. Verifica si ya aprobaste el cuestionario anterior o realizaste el Foro de la unidad, para poder avanzar.";

                        const nombreLargo =
                          CONFIG_MODULOS[modSeleccionado][uniKey][idx];

                        return `
                        <div class="d-flex align-items-start mb-3 ps-2">
                            <div class="me-3 mt-1" style="width:10px; height:10px; border-radius:50%; flex-shrink:0; background-color:${c.nota >= 60 ? "#198754" : c.nota > 0 ? "#dc3545" : "#ffc107"}"></div>
                            <div>
                                <div class="fw-normal text-muted" style="font-size: 0.75rem; line-height: 1.1">${nombreLargo}</div>
                                <div class="mt-1 ${color}" style="font-size: 0.85rem">
                                    <span class="fw-bold" style="font-size: 1.1rem">Nota: ${c.nota}</span> — <small>${msj}</small>
                                </div>
                            </div>
                        </div>`;
                      })
                      .join("")}
                </div>
            `,
              )
              .join("")}
        </div>

        <div class="mt-4 p-3 rounded small bg-info bg-opacity-10 border border-info">
            No se otorga promedio final aquí, la nota oficial aparecerá en Registro Académico tras el cierre del módulo.
        </div>
    </div>
    
    <div class="mt-5 pt-3 border-top">
            <div class="row text-center mt-3">
                <div class="col-6">
                    <div class="fw-bold small">Prof. Renaldy Sánchez</div>
                    <div class="text-muted" style="font-size: 0.7rem;">57985106</div>
                </div>
                <div class="col-6">
                    <div class="fw-bold small">Prof. Mitzy Aguilera</div>
                    <div class="text-muted" style="font-size: 0.7rem;">86961191</div>
                </div>
            </div>
            <div class="text-center mt-3">
                <div class="fw-bold text-primary" style="font-size: 0.75rem;">Equipo de Docencia TIC</div>
                <div class="text-muted" style="font-size: 0.65rem;">Módulos Transversales 2026</div>
            </div>
        </div>
    </div>
    `;
  document.getElementById("area-captura-reporte").innerHTML = html;
  new bootstrap.Modal(document.getElementById("modalReporte")).show();
}

document
  .getElementById("btn-descargar-reporte")
  .addEventListener("click", function () {
    const area = document.getElementById("area-captura-reporte");
    const btn = this;

    const nombreElemento = document.getElementById("nombre-estudiante-reporte");
    let nombreArchivo = "Reporte_Individual";

    if (nombreElemento) {
      nombreArchivo = nombreElemento.innerText.trim().replace(/\s+/g, "_");
    }

    btn.innerHTML = "⌛...";
    btn.disabled = true;

    html2canvas(area, { scale: 2 }).then((canvas) => {
      const link = document.createElement("a");
      link.download = `Reporte_${nombreArchivo}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      btn.innerHTML = "📸 Guardar para WhatsApp";
      btn.disabled = false;
    });
  });

function formatearFechaLarga(fechaStr) {
  const fecha = new Date(fechaStr + "T00:00:00"); // Forzar hora local
  return `${DIAS_SEMANA[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de 2026`;
}

// Guardar datos al procesar
function guardarEnLocal(data) {
  localStorage.setItem(
    "ultimoGrupo",
    JSON.stringify({
      fecha: new Date().toISOString(),
      datos: data,
    }),
  );
}

// Cargar automáticamente al abrir la página
window.addEventListener("load", () => {
  const backup = localStorage.getItem("ultimoGrupo");
  if (backup) {
    const contenido = JSON.parse(backup);
    window.datosProcesados = contenido.datos;
    // Si quieres que se muestre directo al cargar, descomenta la siguiente línea:
    // procesarYMostrar(window.datosProcesados);
  }
});

// --- NUEVAS FUNCIONES DE INTERACTIVIDAD ---

// 1. Hacer que el contador de pendientes sea clicable
document.getElementById("count-pendientes").parentElement.style.cursor = "pointer";
document.getElementById("count-pendientes").parentElement.addEventListener("click", mostrarModalPendientes);

function mostrarModalPendientes() {
    const modSeleccionado = document.getElementById("module-selector").value;
    const listaContenedor = document.getElementById("lista-estudiantes-pendientes");
    const tituloModulo = document.getElementById("modulo-pendiente-titulo");
    
    tituloModulo.innerText = modSeleccionado;
    listaContenedor.innerHTML = "";

    // Filtrar estudiantes que no han completado el módulo
    const pendientes = window.datosProcesados.filter(est => !est.modulos[modSeleccionado].completado);

    if (pendientes.length === 0) {
        listaContenedor.innerHTML = "<div class='p-3 text-center'>No hay estudiantes pendientes.</div>";
    } else {
        pendientes.forEach(est => {
            let aprobados = 0;
            let total = 0;
            const unidades = est.modulos[modSeleccionado].unidades;
            
            for (let u in unidades) {
                unidades[u].forEach(c => {
                    total++;
                    if (c.nota >= 60) aprobados++;
                });
            }

            const item = document.createElement("div");
            item.className = "list-group-item d-flex justify-content-between align-items-center";
            item.innerHTML = `
                <span class="item-nombre text-uppercase">${est.nombre} ${est.apellidos}</span>
                <span class="badge bg-light text-dark border item-conteo">${aprobados} de ${total} cuestionarios</span>
            `;
            listaContenedor.appendChild(item);
        });
    }

    new bootstrap.Modal(document.getElementById("modalPendientes")).show();
}

// 2. Botón para capturar imagen del modal
document.getElementById("btn-captura-pendientes").addEventListener("click", function() {
    const area = document.getElementById("area-captura-pendientes");
    const mod = document.getElementById("module-selector").value;
    const btn = this;
    
    btn.disabled = true;
    btn.innerText = "⌛...";

    html2canvas(area, { scale: 2 }).then(canvas => {
        const link = document.createElement("a");
        link.download = `Pendientes_${mod.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        btn.disabled = false;
        btn.innerText = "📸 Capturar Imagen";
    });
});

// 3. Botón para copiar texto formateado (Markdown para WhatsApp)
document.getElementById("btn-copiar-whatsapp").addEventListener("click", function() {
    const modSeleccionado = document.getElementById("module-selector").value;
    const pendientes = window.datosProcesados.filter(est => !est.modulos[modSeleccionado].completado);
    
    if (pendientes.length === 0) return;

    let texto = `*ESTUDIANTES PENDIENTES*\n`;
    texto += `*Módulo:* ${modSeleccionado}\n`;
    texto += `--------------------------------\n`;

    pendientes.forEach(est => {
        let aprobados = 0;
        let total = 0;
        const unidades = est.modulos[modSeleccionado].unidades;
        for (let u in unidades) {
            unidades[u].forEach(c => {
                total++;
                if (c.nota >= 60) aprobados++;
            });
        }
        texto += `• ${est.nombre} ${est.apellidos} (${aprobados}/${total})\n`;
    });

    texto += `\n_A la par de su nombre aparecen la cantidad de cuestionarios pendientes vs el total. Por favor, tener en cuenta la fecha de corte y ponerse al día con sus actividades._`;

    navigator.clipboard.writeText(texto).then(() => {
        Swal.fire({
            icon: 'success',
            title: '¡Copiado!',
            text: 'El listado se ha copiado al portapapeles para WhatsApp.',
            timer: 2000,
            showConfirmButton: false
        });
    });
});

// --- FUNCIONES PARA COMPLETADOS (REUTILIZANDO LÓGICA) ---

// 1. Hacer que el contador de completados sea clicable
document.getElementById("count-completados").parentElement.style.cursor = "pointer";
document.getElementById("count-completados").parentElement.addEventListener("click", mostrarModalCompletados);

function mostrarModalCompletados() {
    const modSeleccionado = document.getElementById("module-selector").value;
    const listaContenedor = document.getElementById("lista-estudiantes-completados");
    const tituloModulo = document.getElementById("modulo-completo-titulo");
    
    tituloModulo.innerText = modSeleccionado;
    listaContenedor.innerHTML = "";

    // Filtrar estudiantes que SÍ han completado el módulo
    const completados = window.datosProcesados.filter(est => est.modulos[modSeleccionado].completado);

    if (completados.length === 0) {
        listaContenedor.innerHTML = "<div class='p-3 text-center text-muted'>Aún no hay estudiantes que hayan completado este módulo.</div>";
    } else {
        completados.forEach(est => {
            const item = document.createElement("div");
            item.className = "list-group-item d-flex justify-content-between align-items-center";
            item.innerHTML = `
                <span class="item-nombre text-uppercase text-success">${est.nombre} ${est.apellidos}</span>
                <span class="badge bg-success-subtle text-success border border-success-subtle item-conteo">¡FINALIZADO!</span>
            `;
            listaContenedor.appendChild(item);
        });
    }

    new bootstrap.Modal(document.getElementById("modalCompletados")).show();
}

// 2. Botón para capturar imagen de COMPLETADOS
document.getElementById("btn-captura-completados").addEventListener("click", function() {
    const area = document.getElementById("area-captura-completados");
    const mod = document.getElementById("module-selector").value;
    const btn = this;
    
    btn.disabled = true;
    btn.innerText = "⌛...";

    html2canvas(area, { scale: 2 }).then(canvas => {
        const link = document.createElement("a");
        link.download = `Completados_${mod.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        btn.disabled = false;
        btn.innerText = "📸 Capturar Imagen";
    });
});

// 3. Botón para copiar COMPLETADOS (WhatsApp)
document.getElementById("btn-copiar-completados-whatsapp").addEventListener("click", function() {
    const modSeleccionado = document.getElementById("module-selector").value;
    const completados = window.datosProcesados.filter(est => est.modulos[modSeleccionado].completado);
    
    if (completados.length === 0) return;

    let texto = `*ESTUDIANTES QUE COMPLETARON EL MÓDULO* ✅\n`;
    texto += `*Módulo:* ${modSeleccionado}\n`;
    texto += `--------------------------------\n`;

    completados.forEach(est => {
        texto += `✅ ${est.nombre} ${est.apellidos}\n`;
    });

    texto += `\n_¡Felicidades por su excelente desempeño y compromiso!_`;

    navigator.clipboard.writeText(texto).then(() => {
        Swal.fire({
            icon: 'success',
            title: '¡Copiado!',
            text: 'La lista de éxitos se ha copiado al portapapeles.',
            timer: 2000,
            showConfirmButton: false
        });
    });
});
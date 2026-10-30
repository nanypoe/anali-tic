const MOTIVOS_NO_ALERTABLES = new Set(["Falta el valor de Turno"]);

function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[caracter]);
}

function valorCampo(fila, claves) {
  if (!fila) return "";
  const normalizar = (texto) => String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  const clavesNormalizadas = claves.map(normalizar);
  const entrada = Object.entries(fila).find(([clave]) =>
    clavesNormalizadas.includes(normalizar(clave)),
  );
  return entrada && entrada[1] !== null && entrada[1] !== undefined
    ? String(entrada[1]).trim()
    : "";
}

function estudianteRequiereRevision(estudiante) {
  const motivos = (estudiante.diagnosticosGrupo || []).filter(
    (motivo) => !MOTIVOS_NO_ALERTABLES.has(motivo),
  );
  const grupoInfo = estudiante.grupoInfo || {};
  const camposGrupo = [
    grupoInfo.numeroGrupo,
    grupoInfo.grupo,
    grupoInfo.carrera,
  ];
  const tieneCampoGeneral = camposGrupo.some((valor) =>
    /^general$/i.test(String(valor || "").trim()),
  );
  return motivos.length > 0 || tieneCampoGeneral;
}

const TIPOS_NOTIFICACION = [
  {
    id: "asignacion-grupo",
    titulo: "Revisar asignación de grupo",
    descripcion: "Estudiantes sin coincidencia o con datos de grupo incompletos.",
    seleccionar: (estudiantes) => estudiantes.filter(estudianteRequiereRevision),
  },
];

function mostrarValor(valor) {
  return valor ? escapar(valor) : '<span class="text-danger fw-semibold">No disponible</span>';
}

function filaDetalle(etiqueta, valor) {
  return `<tr><th class="text-nowrap">${escapar(etiqueta)}</th><td>${mostrarValor(valor)}</td></tr>`;
}

function renderizarDetalleEstudiante(estudiante) {
  const base = estudiante.infoDb;
  const calificaciones = estudiante.calificacionesRaw;
  const motivos = (estudiante.diagnosticosGrupo || []).filter(
    (motivo) => !MOTIVOS_NO_ALERTABLES.has(motivo),
  );
  const campos = [
    ["Correo en base de datos", valorCampo(base, ["correo", "email", "correo electronico"])],
    ["Correo en calificaciones del Campus", estudiante.correo || valorCampo(calificaciones, ["correo", "email"])],
    ["Grupo en calificaciones", valorCampo(calificaciones, ["grupo", "grupos"])],
    ["Grupos en base de datos", valorCampo(base, ["grupos", "grupo"])],
    ["Carrera en base de datos", valorCampo(base, ["carrera", "carrera tecnica", "programa", "especialidad"])],
    ["Código en base de datos", valorCampo(base, ["codigo", "codigo grupo", "codigo de grupo"])],
    ["Turno en base de datos", valorCampo(base, ["turno"])],
    ["Centro en base de datos", valorCampo(base, ["centro"])],
    ["Grupo asignado por el análisis", estudiante.grupoInfo?.etiquetaGrupo],
  ];
  const motivosHtml = motivos.length
    ? `<ul class="mb-0">${motivos.map((motivo) => `<li>${escapar(motivo)}</li>`).join("")}</ul>`
    : '<span class="text-muted">El análisis detectó un valor GENERAL.</span>';

  return `
    <section class="border rounded-3 p-3 mb-3">
      <h6 class="fw-bold mb-1">${escapar(`${estudiante.nombre || ""} ${estudiante.apellidos || ""}`.trim() || "Estudiante sin nombre")}</h6>
      <p class="small text-muted mb-2">${escapar(estudiante.correo || "Sin correo")}</p>
      <div class="table-responsive">
        <table class="table table-sm table-bordered align-middle mb-2">
          <tbody>${campos.map(([etiqueta, valor]) => filaDetalle(etiqueta, valor)).join("")}</tbody>
        </table>
      </div>
      <div class="small"><strong>Problemas detectados:</strong> ${motivosHtml}</div>
    </section>`;
}

function mostrarModal(tipo, estudiantes) {
  const modalEl = document.getElementById("modal-notificaciones");
  const titulo = document.getElementById("notificaciones-modal-titulo");
  const cuerpo = document.getElementById("notificaciones-modal-cuerpo");
  if (!modalEl || !titulo || !cuerpo) return;

  titulo.textContent = `${tipo.titulo} (${estudiantes.length})`;
  cuerpo.innerHTML = `
    <div class="alert alert-warning">
      Revisa la base de datos de estudiantes: puede haber un correo incorrecto o información académica incompleta. Compara el correo registrado en la base con el que el estudiante utiliza para matricularse en el Campus.
    </div>
    <p class="small text-muted">Los campos que aparecen como “No disponible” no se encontraron en la fila vinculada de la base de datos.</p>
    ${estudiantes.map(renderizarDetalleEstudiante).join("")}`;
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

export function inicializarNotificaciones(estudiantes, tipoBase) {
  const boton = document.getElementById("btn-notificaciones");
  const contador = document.getElementById("notificaciones-contador");
  const menu = document.getElementById("notificaciones-menu");
  if (!boton || !contador || !menu) return;

  const notificaciones = tipoBase === "tic"
    ? TIPOS_NOTIFICACION
      .map((tipo) => ({ tipo, estudiantes: tipo.seleccionar(estudiantes) }))
      .filter(({ estudiantes: afectados }) => afectados.length > 0)
    : [];
  const totalAfectados = notificaciones.reduce(
    (total, notificacion) => total + notificacion.estudiantes.length,
    0,
  );

  boton.classList.toggle("d-none", totalAfectados === 0);
  boton.setAttribute(
    "aria-label",
    totalAfectados
      ? `Notificaciones: ${totalAfectados} estudiante(s) requieren revisión`
      : "Sin notificaciones",
  );
  contador.textContent = String(totalAfectados);
  menu.replaceChildren();

  notificaciones.forEach(({ tipo, estudiantes: afectados }) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "dropdown-item text-wrap py-2";
    item.innerHTML = `
      <span class="fw-semibold d-block">${escapar(tipo.titulo)}</span>
      <span class="small text-muted">${afectados.length} estudiante(s): ${escapar(tipo.descripcion)}</span>`;
    item.addEventListener("click", () => mostrarModal(tipo, afectados));
    menu.appendChild(item);
  });
}

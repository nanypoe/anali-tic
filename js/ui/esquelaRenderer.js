/* js/ui/esquelaRenderer.js */

import {
  CENTRO_POR_DEFECTO,
  centroPredominante,
  nombreCentroPorCodigo,
  obtenerEstudiantesPendientes,
  obtenerGruposAnalizados,
  detectarModuloOptativoPorGrupo,
  obtenerModulosOptativos,
  obtenerClaveGrupo,
  obtenerEtiquetaGrupo,
  formatearNombre,
  escaparHtml,
} from "./exportRenderer.js";
import { textoCierreDocumento } from "../core/fechas.js";
import { getTipoBase } from "../core/store.js";

const CDN_DOCX = "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js";
const TIPO_MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

let promesaDocx = null;

/**
 * Carga docx.js bajo demanda, solo cuando se genera la primera esquela.
 */
function cargarDocx() {
  if (globalThis.docx) return Promise.resolve(globalThis.docx);
  if (promesaDocx) return promesaDocx;

  promesaDocx = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CDN_DOCX;
    script.async = true;
    script.onload = () => {
      if (globalThis.docx) {
        resolve(globalThis.docx);
      } else {
        reject(new Error("La librería para generar Word no se cargó correctamente."));
      }
    };
    script.onerror = () => {
      promesaDocx = null;
      reject(
        new Error(
          "No se pudo cargar la librería para generar Word. Verifique su conexión a internet.",
        ),
      );
    };
    document.head.appendChild(script);
  });

  return promesaDocx;
}

function formatearFecha(valor) {
  const partes = String(valor || "").split("-");
  if (partes.length !== 3) return valor || "";
  const [anio, mes, dia] = partes;
  return `${dia}/${mes}/${anio}`;
}

function formatearHora(valor) {
  const partes = String(valor || "").split(":");
  if (partes.length < 2) return valor || "";

  const hora = Number(partes[0]);
  const minuto = Number(partes[1]);
  if (Number.isNaN(hora) || Number.isNaN(minuto)) return valor || "";

  const periodo = hora >= 12 ? "pm" : "am";
  let hora12 = hora % 12;
  if (hora12 === 0) hora12 = 12;

  return `${String(hora12).padStart(2, "0")}:${String(minuto).padStart(
    2,
    "0",
  )}${periodo}`;
}

function fechaHoyInput() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function limpiarNombreArchivo(texto) {
  return String(texto || "Esquela")
    .replace(/[ÁÀÄÂ]/gi, "A")
    .replace(/[ÉÈËÊ]/gi, "E")
    .replace(/[ÍÌÏÎ]/gi, "I")
    .replace(/[ÓÒÖÔ]/gi, "O")
    .replace(/[ÚÙÜÛ]/gi, "U")
    .replace(/Ñ/gi, "N")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function crearTexto(docxLib, texto, opciones = {}) {
  return new docxLib.TextRun({
    text: String(texto ?? ""),
    font: "Arial",
    size: opciones.size ?? 22,
    bold: opciones.bold ?? false,
    italics: opciones.italics ?? false,
    color: opciones.color ?? "000000",
  });
}

function crearTablaDatos(docxLib, filas) {
  const bordes = {
    top: { style: docxLib.BorderStyle.SINGLE, size: 4, color: "B4C6E7" },
    bottom: { style: docxLib.BorderStyle.SINGLE, size: 4, color: "B4C6E7" },
    left: { style: docxLib.BorderStyle.SINGLE, size: 4, color: "B4C6E7" },
    right: { style: docxLib.BorderStyle.SINGLE, size: 4, color: "B4C6E7" },
  };

  return new docxLib.Table({
    width: { size: 100, type: docxLib.WidthType.PERCENTAGE },
    rows: filas.map(
      ([etiqueta, valor]) =>
        new docxLib.TableRow({
          children: [
            new docxLib.TableCell({
              width: { size: 34, type: docxLib.WidthType.PERCENTAGE },
              shading: { fill: "D9E2F3" },
              borders: bordes,
              children: [
                new docxLib.Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [
                    crearTexto(docxLib, etiqueta, {
                      size: 20,
                      bold: true,
                      color: "5B3DF5",
                    }),
                  ],
                }),
              ],
            }),
            new docxLib.TableCell({
              width: { size: 66, type: docxLib.WidthType.PERCENTAGE },
              borders: bordes,
              children: [
                new docxLib.Paragraph({
                  spacing: { before: 60, after: 60 },
                  children: [crearTexto(docxLib, valor, { size: 20 })],
                }),
              ],
            }),
          ],
        }),
    ),
  });
}

function crearFirmas(docxLib) {
  const sinBordes = {
    top: { style: docxLib.BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: docxLib.BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: docxLib.BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: docxLib.BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };
  const linea = "______________________________";

  return new docxLib.Table({
    width: { size: 100, type: docxLib.WidthType.PERCENTAGE },
    borders: sinBordes,
    rows: [
      new docxLib.TableRow({
        children: [
          new docxLib.TableCell({
            width: { size: 50, type: docxLib.WidthType.PERCENTAGE },
            borders: sinBordes,
            children: [
              new docxLib.Paragraph({
                alignment: docxLib.AlignmentType.CENTER,
                spacing: { before: 360, after: 80 },
                children: [crearTexto(docxLib, linea, { size: 20 })],
              }),
            ],
          }),
          new docxLib.TableCell({
            width: { size: 50, type: docxLib.WidthType.PERCENTAGE },
            borders: sinBordes,
            children: [
              new docxLib.Paragraph({
                alignment: docxLib.AlignmentType.CENTER,
                spacing: { before: 360, after: 80 },
                children: [crearTexto(docxLib, linea, { size: 20 })],
              }),
            ],
          }),
        ],
      }),
      new docxLib.TableRow({
        children: [
          new docxLib.TableCell({
            width: { size: 50, type: docxLib.WidthType.PERCENTAGE },
            borders: sinBordes,
            children: [
              new docxLib.Paragraph({
                alignment: docxLib.AlignmentType.CENTER,
                children: [
                  crearTexto(docxLib, "Firma del/de la estudiante", {
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
          new docxLib.TableCell({
            width: { size: 50, type: docxLib.WidthType.PERCENTAGE },
            borders: sinBordes,
            children: [
              new docxLib.Paragraph({
                alignment: docxLib.AlignmentType.CENTER,
                children: [
                  crearTexto(docxLib, "Nombre y firma del responsable", {
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Bloque "Cierre del módulo" para cada módulo pendiente con fecha configurada.
 * Usa el mismo texto que la boleta y WhatsApp, y enlaza con el compromiso de reparación.
 * Solo aplica a bases TIC.
 */
function crearBloqueCierre(docxLib, pendiente, opciones) {
  if (!opciones.esTic || !opciones.configAula) return [];
  const avisos = pendiente.modulosPendientes
    .map((modulo) => ({ modulo, cierre: textoCierreDocumento(opciones.configAula, modulo) }))
    .filter((a) => a.cierre);
  if (avisos.length === 0) return [];

  const parrafos = [
    new docxLib.Paragraph({
      alignment: docxLib.AlignmentType.LEFT,
      spacing: { before: 240, after: 100 },
      children: [
        crearTexto(docxLib, "CIERRE DEL MÓDULO", { size: 22, bold: true, color: "5B3DF5" }),
      ],
    }),
  ];

  avisos.forEach(({ modulo, cierre }) => {
    parrafos.push(
      new docxLib.Paragraph({
        alignment: docxLib.AlignmentType.LEFT,
        spacing: { after: 60 },
        children: [
          crearTexto(docxLib, `${modulo}: `, { size: 20, bold: true }),
          crearTexto(docxLib, cierre.titulo, { size: 20, bold: true, color: cierre.vencido ? "B42318" : "7C4A00" }),
        ],
      }),
    );
    parrafos.push(
      new docxLib.Paragraph({
        alignment: docxLib.AlignmentType.JUSTIFIED,
        spacing: { after: 140, line: 264 },
        children: [crearTexto(docxLib, cierre.detalle, { size: 20, italics: true })],
      }),
    );
  });

  parrafos.push(
    new docxLib.Paragraph({
      alignment: docxLib.AlignmentType.JUSTIFIED,
      spacing: { after: 200, line: 264 },
      children: [
        crearTexto(
          docxLib,
          "En concordancia con lo anterior, la reparación del módulo se realizará dentro del período habilitado indicado en esta esquela.",
          { size: 20 },
        ),
      ],
    }),
  );
  return parrafos;
}

function crearContenidoEsquela(docxLib, pendiente, opciones) {
  const contenido = [];

  contenido.push(
    new docxLib.Paragraph({
      alignment: docxLib.AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        crearTexto(
          docxLib,
          "INSTITUTO NACIONAL TÉCNICO Y TECNOLÓGICO (INATEC)",
          { size: 24, bold: true, color: "5B3DF5" },
        ),
      ],
    }),
  );

  contenido.push(
    new docxLib.Paragraph({
      alignment: docxLib.AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        crearTexto(docxLib, opciones.centro, {
          size: 24,
          bold: true,
          color: "000000",
        }),
      ],
    }),
  );

  contenido.push(
    new docxLib.Paragraph({
      alignment: docxLib.AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [
        crearTexto(
          docxLib,
          "ESQUELA DE COMPROMISO PARA REPARACIÓN DE MÓDULO",
          { size: 24, bold: true, color: "5B3DF5" },
        ),
      ],
    }),
  );

  contenido.push(
    new docxLib.Paragraph({
      alignment: docxLib.AlignmentType.JUSTIFIED,
      spacing: { line: 276, after: 220 },
      children: [
        crearTexto(
          docxLib,
          "Por medio de la presente, el/la estudiante manifiesta su compromiso de realizar la reparación del módulo pendiente dentro del período habilitado, cumpliendo las orientaciones académicas establecidas y haciendo uso responsable del intento autorizado.",
          { size: 22 },
        ),
      ],
    }),
  );

  contenido.push(
    crearTablaDatos(docxLib, [
      ["Nombre completo del estudiante", pendiente.nombre],
      ["Código de grupo", pendiente.claveGrupo],
      ["Carrera", pendiente.carrera],
      ["Turno", pendiente.turno],
      ["Módulo(s) Pendiente(s)", pendiente.modulosPendientes.join(", ")],
      ["Fecha de apertura", opciones.fecha],
      ["Hora de inicio", opciones.horaInicio],
      ["Fecha de cierre", opciones.fechaCierre],
      ["Hora de cierre", opciones.horaFin],
    ]),
  );

  contenido.push(...crearBloqueCierre(docxLib, pendiente, opciones));

  contenido.push(
    new docxLib.Paragraph({
      alignment: docxLib.AlignmentType.LEFT,
      spacing: { before: 320, after: 100 },
      children: [
        crearTexto(docxLib, "COMPROMISO DEL/DE LA ESTUDIANTE", {
          size: 24,
          bold: true,
          color: "5B3DF5",
        }),
      ],
    }),
  );

  contenido.push(
    new docxLib.Paragraph({
      alignment: docxLib.AlignmentType.JUSTIFIED,
      spacing: { line: 276, after: 300 },
      children: [
        crearTexto(
          docxLib,
          "Declaro que conozco el horario asignado para la reparación del módulo y me comprometo a desarrollar las actividades correspondientes dentro del tiempo establecido. Asimismo, entiendo que debo respetar las orientaciones del personal responsable y que la apertura del módulo no garantiza su aprobación automática.",
          { size: 22 },
        ),
      ],
    }),
  );

  contenido.push(crearFirmas(docxLib));

  return contenido;
}

/**
 * Genera y descarga un .docx con una esquela por estudiante. Si hay varios
 * estudiantes, cada esquela comienza en una página nueva.
 */
export async function descargarEsquelasWord(pendientes, opciones) {
  const docxLib = await cargarDocx();
  const hijos = [];

  pendientes.forEach((pendiente, indice) => {
    if (indice > 0) {
      hijos.push(
        new docxLib.Paragraph({
          children: [new docxLib.PageBreak()],
        }),
      );
    }
    hijos.push(...crearContenidoEsquela(docxLib, pendiente, opciones));
  });

  const documento = new docxLib.Document({
    creator: "Anali-TIC",
    title: "Esquela de compromiso para reparación de módulo",
    description: "Documento de control y seguimiento académico",
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        footers: {
          default: new docxLib.Footer({
            children: [
              new docxLib.Paragraph({
                alignment: docxLib.AlignmentType.CENTER,
                children: [
                  crearTexto(
                    docxLib,
                    "Documento de control y seguimiento académico",
                    { size: 18, italics: true, color: "7F7F7F" },
                  ),
                ],
              }),
            ],
          }),
        },
        children: hijos,
      },
    ],
  });

  let blob = null;

  if (typeof docxLib.Packer.toBlob === "function") {
    try {
      blob = await docxLib.Packer.toBlob(documento);
    } catch (error) {
      blob = null;
    }
  }

  if (!blob) {
    const buffer = await docxLib.Packer.toBuffer(documento);
    blob = new Blob([buffer], { type: TIPO_MIME_DOCX });
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const identificador = opciones.esGrupo
    ? opciones.grupo || pendientes[0].claveGrupo
    : pendientes[0].nombre;
  enlace.href = url;
  enlace.download = `Esquela_${limpiarNombreArchivo(
    identificador,
  )}_${String(opciones.fechaRaw || fechaHoyInput()).replace(/-/g, "")}.docx`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 1500);

  return pendientes.length;
}

/**
 * Abre el modal para configurar y descargar la esquela.
 */
export function mostrarModalEsquela(
  datosEstudiantes,
  configAula,
  estudiantePreseleccionado = null,
) {
  const modalEl = document.getElementById("modalEsquela");
  if (!modalEl) return;

  const modoSelect = document.getElementById("esquela-modo-selector");
  const centroSelect = document.getElementById("esquela-centro-selector");
  const grupoContainer = document.getElementById("esquela-grupo-container");
  const grupoSelect = document.getElementById("esquela-grupo-selector");
  const estudianteContainer = document.getElementById(
    "esquela-estudiante-container",
  );
  const estudianteSelect = document.getElementById(
    "esquela-estudiante-selector",
  );
  const optativoContainer = document.getElementById(
    "esquela-optativo-container",
  );
  const optativoSelect = document.getElementById("esquela-optativo-selector");
  const fechaInput = document.getElementById("esquela-fecha");
  const fechaCierreInput = document.getElementById("esquela-fecha-cierre");
  const horaInicioInput = document.getElementById("esquela-hora-inicio");
  const horaFinInput = document.getElementById("esquela-hora-fin");
  const resumen = document.getElementById("esquela-resumen");
  const btnDescargar = document.getElementById("btn-confirmar-esquela");

  const grupos = obtenerGruposAnalizados(datosEstudiantes);
  if (centroSelect) centroSelect.value = centroPredominante(datosEstudiantes) || CENTRO_POR_DEFECTO;
  const estudiantes = (datosEstudiantes || [])
    .map((estudiante, index) => ({ estudiante, index }))
    .filter(({ estudiante }) => estudiante?.estadoEstudiante !== "retirado")
    .sort((a, b) =>
      formatearNombre(a.estudiante).localeCompare(
        formatearNombre(b.estudiante),
        "es",
        { sensitivity: "base" },
      ),
    );

  if (grupoSelect) {
    grupoSelect.innerHTML = grupos
      .map(
        (grupo) =>
          `<option value="${escaparHtml(grupo.clave)}">${escaparHtml(
            grupo.etiqueta,
          )}</option>`,
      )
      .join("");
  }

  if (estudianteSelect) {
    estudianteSelect.innerHTML = estudiantes
      .map(
        ({ estudiante, index }) =>
          `<option value="${index}">${escaparHtml(
            formatearNombre(estudiante),
          )} — ${escaparHtml(obtenerEtiquetaGrupo(estudiante))}</option>`,
      )
      .join("");
  }

  if (fechaInput && !fechaInput.value) fechaInput.value = fechaHoyInput();
  if (fechaCierreInput && !fechaCierreInput.value) fechaCierreInput.value = fechaInput?.value || fechaHoyInput();
  if (horaInicioInput && !horaInicioInput.value) horaInicioInput.value = "08:00";
  if (horaFinInput && !horaFinInput.value) horaFinInput.value = "12:00";

  let grupoPreseleccionado = grupos[0]?.clave || "";

  if (estudiantePreseleccionado) {
    grupoPreseleccionado = obtenerClaveGrupo(estudiantePreseleccionado);
    if (modoSelect) modoSelect.value = "individual";

    const indicePreseleccionado = datosEstudiantes.indexOf(
      estudiantePreseleccionado,
    );
    if (indicePreseleccionado >= 0 && estudianteSelect) {
      estudianteSelect.value = String(indicePreseleccionado);
    }
  } else if (modoSelect) {
    modoSelect.value = "grupo";
  }

  if (
    grupoSelect &&
    grupoPreseleccionado &&
    grupos.some((grupo) => grupo.clave === grupoPreseleccionado)
  ) {
    grupoSelect.value = grupoPreseleccionado;
  }

  const optativos = obtenerModulosOptativos(configAula);
  const seleccionesOptativas = new Map();

  const obtenerGrupoSeleccionado = () => {
    if (modoSelect?.value === "individual") {
      const indice = Number(estudianteSelect?.value);
      const estudiante = datosEstudiantes[indice];
      if (!estudiante) return null;

      const clave = obtenerClaveGrupo(estudiante);
      return (
        grupos.find((grupo) => grupo.clave === clave) || {
          clave,
          etiqueta: obtenerEtiquetaGrupo(estudiante),
          estudiantes: [estudiante],
        }
      );
    }

    return grupos.find((grupo) => grupo.clave === grupoSelect?.value) || null;
  };

  const actualizarVisibilidad = () => {
    const individual = modoSelect?.value === "individual";
    if (grupoContainer) grupoContainer.classList.toggle("d-none", individual);
    if (estudianteContainer)
      estudianteContainer.classList.toggle("d-none", !individual);
  };

  const actualizarOptativos = () => {
    const grupo = obtenerGrupoSeleccionado();

    if (!grupo || optativos.length <= 1 || !optativoContainer) {
      if (optativoContainer) optativoContainer.classList.add("d-none");
      if (optativoSelect) optativoSelect.innerHTML = "";
      return;
    }

    optativoContainer.classList.remove("d-none");

    let seleccionado = seleccionesOptativas.get(grupo.clave);
    if (!seleccionado) {
      seleccionado = detectarModuloOptativoPorGrupo(grupo, optativos);
    }

    if (optativoSelect) {
      optativoSelect.innerHTML = optativos
        .map(
          (nombre) =>
            `<option value="${escaparHtml(nombre)}" ${
              nombre === seleccionado ? "selected" : ""
            }>${escaparHtml(nombre)}</option>`,
        )
        .join("");
    }

    seleccionesOptativas.set(grupo.clave, seleccionado);
  };

  const obtenerSeleccion = () => {
    const esIndividual = modoSelect?.value === "individual";
    const estudianteSeleccionado = esIndividual
      ? datosEstudiantes[Number(estudianteSelect?.value)]
      : null;
    const grupo = obtenerGrupoSeleccionado();
    if (!grupo) return { grupo: null, pendientes: [] };

    const optativo =
      optativos.length > 1 ? optativoSelect?.value : optativos[0] || null;
    const mapping = optativo ? { [grupo.clave]: optativo } : {};

    const pendientes = obtenerEstudiantesPendientes(
      datosEstudiantes,
      configAula,
      mapping,
    ).filter((pendiente) =>
      esIndividual
        ? pendiente.estudiante === estudianteSeleccionado
        : grupo.estudiantes.some(
            (estudiante) => estudiante === pendiente.estudiante,
          ),
    );

    return { grupo, pendientes };
  };

  const actualizarResumen = () => {
    const { grupo, pendientes } = obtenerSeleccion();
    const esIndividual = modoSelect?.value === "individual";
    const estudianteActual = esIndividual
      ? datosEstudiantes[Number(estudianteSelect?.value)]
      : null;
    const etiquetaSeleccion =
      esIndividual && estudianteActual
        ? formatearNombre(estudianteActual)
        : grupo?.etiqueta || "";
    const fecha = fechaInput?.value || "";
    const fechaCierre = fechaCierreInput?.value || "";
    const horaInicio = horaInicioInput?.value || "";
    const horaFin = horaFinInput?.value || "";
    const rangoValido = !fechaCierre || !fecha || fechaCierre >= fecha;
    const listo = Boolean(
      fecha && fechaCierre && horaInicio && horaFin && pendientes.length > 0 && rangoValido,
    );

    if (resumen) {
      resumen.className = `alert small mt-3 mb-0 ${
        listo ? "alert-info" : "alert-warning"
      }`;

      if (!grupo) {
        resumen.innerHTML =
          "No hay grupos disponibles para generar la esquela.";
      } else if (pendientes.length === 0) {
        resumen.innerHTML = esIndividual
          ? `El/la estudiante <strong>${escaparHtml(
              etiquetaSeleccion,
            )}</strong> no tiene módulos pendientes para la selección actual.`
          : `La selección <strong>${escaparHtml(
              etiquetaSeleccion,
            )}</strong> no tiene estudiantes con módulos pendientes.`;
      } else if (!rangoValido) {
        resumen.innerHTML = "La <strong>fecha de cierre</strong> no puede ser anterior a la fecha de apertura.";
      } else {
        resumen.innerHTML = `Se generará${
          pendientes.length === 1 ? "" : "n"
        } <strong>${pendientes.length}</strong> esquela${
          pendientes.length === 1 ? "" : "s"
        } para <strong>${escaparHtml(etiquetaSeleccion)}</strong>.`;
      }
    }

    if (btnDescargar) btnDescargar.disabled = !listo;
    return { grupo, pendientes };
  };

  if (modoSelect) {
    modoSelect.onchange = () => {
      actualizarVisibilidad();
      actualizarOptativos();
      actualizarResumen();
    };
  }

  if (grupoSelect) {
    grupoSelect.onchange = () => {
      actualizarOptativos();
      actualizarResumen();
    };
  }

  if (estudianteSelect) {
    estudianteSelect.onchange = () => {
      const indice = Number(estudianteSelect.value);
      const estudiante = datosEstudiantes[indice];
      if (estudiante) {
        const clave = obtenerClaveGrupo(estudiante);
        if (grupoSelect && grupos.some((grupo) => grupo.clave === clave)) {
          grupoSelect.value = clave;
        }
      }
      actualizarOptativos();
      actualizarResumen();
    };
  }

  if (optativoSelect) {
    optativoSelect.onchange = () => {
      const grupo = obtenerGrupoSeleccionado();
      if (grupo) seleccionesOptativas.set(grupo.clave, optativoSelect.value);
      actualizarResumen();
    };
  }

  [fechaInput, fechaCierreInput, horaInicioInput, horaFinInput].forEach((input) => {
    if (!input) return;
    input.onchange = actualizarResumen;
    input.oninput = actualizarResumen;
  });

  actualizarVisibilidad();
  actualizarOptativos();
  actualizarResumen();

  if (btnDescargar) {
    btnDescargar.onclick = async () => {
      const { grupo, pendientes } = actualizarResumen();
      if (!grupo || pendientes.length === 0) return;

      const textoOriginal = btnDescargar.innerHTML;
      btnDescargar.disabled = true;
      btnDescargar.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1"></span> Generando...';

      try {
        await descargarEsquelasWord(pendientes, {
          configAula,
          esTic: getTipoBase() === "tic",
          centro: nombreCentroPorCodigo(centroSelect?.value || CENTRO_POR_DEFECTO),
          fechaRaw: fechaInput.value,
          fecha: formatearFecha(fechaInput.value),
          fechaCierre: formatearFecha(fechaCierreInput.value),
          horaInicio: formatearHora(horaInicioInput.value),
          horaFin: formatearHora(horaFinInput.value),
          esGrupo: modoSelect?.value === "grupo",
          grupo: grupo.clave,
        });

        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      } catch (error) {
        console.error("Error al generar la esquela:", error);
        alert(`No se pudo generar la esquela: ${error.message}`);
      } finally {
        btnDescargar.innerHTML = textoOriginal;
        actualizarResumen();
      }
    };
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

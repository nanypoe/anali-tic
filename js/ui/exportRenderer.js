/* js/ui/exportRenderer.js */

/**
 * Exportación global de estudiantes con módulos pendientes a Excel (.xlsx)
 * con formato institucional (título combinado, subtítulo, encabezados,
 * filtros automáticos y columnas para firma/seguimiento).
 */

import {
  resolverCentro,
  resolverCarrera,
  resolverNombreCortoCarrera,
  centroPredominante,
} from "../core/diccionarios.js";
import {
  formatearEtiquetaGrupo,
  obtenerComponentesGrupo,
} from "../core/groupFormat.js";
import { pulsar, toast } from "./feedback.js";

export const CENTRO_POR_DEFECTO = "ctche";

/**
 * Nombre institucional completo a partir del código del diccionario (ctche, subsede, ctfabretto).
 */
export function nombreCentroPorCodigo(codigo) {
  return (
    resolverCentro(codigo)?.nombre ||
    String(codigo || "").trim() ||
    resolverCentro(CENTRO_POR_DEFECTO)?.nombre ||
    ""
  );
}

export { centroPredominante };

const COLORES = {
  azulCorporativo: "FF5B3DF5",
  azulClaro: "FFD9E2F3",
  azulBorde: "FFB4C6E7",
  blanco: "FFFFFFFF",
  texto: "FF1F2937",
  banda: "FFF2F6FC",
  amarillo: "FFFFEB9C",
  amarilloTexto: "FF9C6500",
  rojo: "FFFFC7CE",
  rojoTexto: "FF9C0006",
  noAplicaFondo: "FFF2F2F2",
  noAplicaTexto: "FF808080",
};

// Módulos que se cursan de forma alternativa: cada grupo lleva uno de los dos.
const MODULOS_OPTATIVOS = ["Identidad Cultural", "Cultura de Paz"];

// Carreras que usan el prefijo TE en lugar de TG.
const CARRERAS_PREFIJO_TE = ["diseno", "banca", "programacion"];

const COLUMNAS = [
  { header: "No", width: 6, align: "center" },
  { header: "Carrera Técnica", width: 32, align: "left" },
  { header: "Grupo", width: 24, align: "center" },
  { header: "Turno", width: 14, align: "center" },
  { header: "Nombres y apellidos del estudiante", width: 34, align: "left" },
  {
    header: "Módulo(s) reprobado(s) / pendiente(s)",
    width: 70,
    align: "left",
  },
  {
    header: "Cantidad de Módulos pendientes",
    width: 17,
    align: "center",
  },
  { header: "Fecha de notificación", width: 24, align: "center" },
  { header: "Firma", width: 28, align: "center" },
  { header: "Seguimiento", width: 28, align: "center" },
];

const TOTAL_COLUMNAS = COLUMNAS.length;
const FILA_ENCABEZADO = 4;
const FILA_PRIMER_DATO = 5;
const TAMANO_TITULO = 28;
const COLUMNA_GRUPO = 3;
const FIJAS_CALIFICACIONES = 4;
const LINEA_MODULO = { style: "medium", color: { argb: "FF5B3DF5" } };

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Formatea la carrera técnica con el prefijo institucional:
 * TG- para la mayoría y TE- para diseño, banca y programación.
 */
export function formatearCarrera(estudiante) {
  let base = String(estudiante?.grupoInfo?.carrera || "").trim();

  base = base.replace(/^[\s\-–:,;.]+|[\s\-–:,;.]+$/g, "").trim();

  // Si el valor recibido es en realidad un código de grupo, se descarta.
  if (
    /^(TG|TE)[-\s]\d/i.test(base) ||
    /^\d+([-\s]\d+)+$/.test(base) ||
    /^G\d+$/i.test(base)
  ) {
    base = "";
  }

  // Respaldo para bases de datos antiguas que no tengan columna Carrera.
  if (!base) {
    const grupo = String(estudiante?.grupoInfo?.grupo || "").trim();
    if (
      grupo &&
      !/^(TG|TE)[-\s]/i.test(grupo) &&
      !/^\d+([-\s]\d+)+$/.test(grupo) &&
      !/^G\d+$/i.test(grupo)
    ) {
      base = grupo;
    }
  }

  base = base
    .replace(/\b(matutino|vespertino|nocturno|sabatino|dominical|diurno)\b/gi, "")
    .replace(/^(TG|TE)\s*[-–]\s*/i, "")
    .replace(/^G\d+\s*[-–:]\s*/i, "")
    .replace(/^[\s\-–:,;.]+|[\s\-–:,;.]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (
    !base ||
    /^general$/i.test(base) ||
    /^sin grupo asignado$/i.test(base)
  ) {
    return "";
  }

  // Si la carrera existe en el diccionario, se usa su nombre completo institucional.
  const carreraCompleta = resolverCarrera(base);
  if (carreraCompleta) return carreraCompleta.toUpperCase();

  const normalizada = normalizarTexto(base);
  const prefijo = CARRERAS_PREFIJO_TE.some((carrera) =>
    normalizada.includes(carrera),
  )
    ? "TE"
    : "TG";

  return `${prefijo}-${base.toUpperCase()}`;
}

/**
 * Normaliza el turno a mayúsculas y a los valores institucionales.
 */
export function formatearTurno(estudiante) {
  let turno = String(estudiante?.grupoInfo?.turno || "")
    .replace(/\s+/g, " ")
    .trim();

  // Si no viene un turno explícito, se intenta deducir desde los datos del grupo.
  if (!turno || /^general$/i.test(turno)) {
    turno = [
      estudiante?.grupoInfo?.carrera,
      estudiante?.grupoInfo?.codigo,
      estudiante?.grupoInfo?.grupo,
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (!turno || /^general$/i.test(turno)) return "";

  const lower = turno.toLowerCase();
  if (lower.includes("matutino") || lower.includes("diurno")) return "MATUTINO";
  if (lower.includes("vespertino")) return "VESPERTINO";
  if (lower.includes("nocturno")) return "NOCTURNO";
  if (lower.includes("sabatino")) return "SABATINO";
  if (lower.includes("dominical")) return "DOMINICAL";
  if (lower.includes("virtual")) return "VIRTUAL";

  return "";
}

/**
 * Clave única del grupo: se usa el Código de la base de datos y, si no existe,
 * se recurre al grupo interno o a la etiqueta.
 */
export function obtenerClaveGrupo(estudiante) {
  const codigo = String(estudiante?.grupoInfo?.codigo || "").trim();
  if (codigo && !/^n\/?[da]$/i.test(codigo)) return codigo;

  const grupo = String(estudiante?.grupoInfo?.grupo || "").trim();
  if (grupo) return grupo;

  return String(estudiante?.grupoInfo?.etiquetaGrupo || "SIN GRUPO").trim();
}

export function obtenerEtiquetaGrupo(estudiante) {
  return formatearEtiquetaGrupo(estudiante?.grupoInfo);
}

export function escaparHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (caracter) => {
    switch (caracter) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return caracter;
    }
  });
}

export function obtenerModulosOptativos(configAula) {
  const nombresModulos = Object.keys(configAula?.modulos || {});
  return MODULOS_OPTATIVOS.filter((nombre) => nombresModulos.includes(nombre));
}

export function obtenerModuloOptativoSeleccionado(
  estudiante,
  configAula,
  moduloOptativoPorGrupo = {},
) {
  const optativos = obtenerModulosOptativos(configAula);
  if (optativos.length === 0) return null;
  if (optativos.length === 1) return optativos[0];

  const clave = obtenerClaveGrupo(estudiante);
  const seleccionado = moduloOptativoPorGrupo?.[clave];
  return optativos.includes(seleccionado) ? seleccionado : optativos[0];
}

/**
 * Une nombre y apellidos sin duplicar espacios.
 */
export function formatearNombre(estudiante) {
  return `${estudiante?.nombre || ""} ${estudiante?.apellidos || ""}`
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fecha de notificación con formato: 26/10/2026 06:30pm
 */
function formatearFechaNotificacion(fecha) {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();

  let horas = fecha.getHours();
  const periodo = horas >= 12 ? "pm" : "am";
  horas = horas % 12;
  if (horas === 0) horas = 12;

  const horasStr = String(horas).padStart(2, "0");
  const minutosStr = String(fecha.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${anio} ${horasStr}:${minutosStr}${periodo}`;
}

/**
 * Obtiene los módulos pendientes de un estudiante dentro de la configuración
 * de aula cargada. Un módulo está pendiente cuando no está completado ni
 * convalidado. Los estudiantes retirados no se incluyen.
 */
function obtenerModulosPendientes(
  estudiante,
  configAula,
  moduloOptativoPorGrupo = {},
) {
  const nombresModulos = Object.keys(configAula?.modulos || {});
  const optativos = obtenerModulosOptativos(configAula);
  const optativoSeleccionado =
    optativos.length > 1
      ? obtenerModuloOptativoSeleccionado(
          estudiante,
          configAula,
          moduloOptativoPorGrupo,
        )
      : null;

  return nombresModulos.filter((nombreModulo) => {
    // Si el grupo cursa uno de los módulos optativos, el otro no se evalúa.
    if (
      optativos.length > 1 &&
      optativos.includes(nombreModulo) &&
      nombreModulo !== optativoSeleccionado
    ) {
      return false;
    }

    const modulo = estudiante?.modulos?.[nombreModulo];
    if (!modulo) return true;
    return !modulo.completado && !modulo.estaConvalidado;
  });
}

/**
 * Construye la lista global de estudiantes con al menos un módulo pendiente,
 * ordenada por carrera, turno y nombre.
 */
export function obtenerEstudiantesPendientes(
  datosEstudiantes,
  configAula,
  moduloOptativoPorGrupo = {},
) {
  const lista = [];

  (datosEstudiantes || []).forEach((estudiante) => {
    if (estudiante?.estadoEstudiante === "retirado") return;

    const modulosPendientes = obtenerModulosPendientes(
      estudiante,
      configAula,
      moduloOptativoPorGrupo,
    );
    if (modulosPendientes.length === 0) return;

    lista.push({
      estudiante,
      modulosPendientes,
      carrera: formatearCarrera(estudiante),
      turno: formatearTurno(estudiante),
      nombre: formatearNombre(estudiante),
      claveGrupo: obtenerClaveGrupo(estudiante),
      etiquetaGrupo: obtenerEtiquetaGrupo(estudiante),
      moduloOptativo: obtenerModuloOptativoSeleccionado(
        estudiante,
        configAula,
        moduloOptativoPorGrupo,
      ),
    });
  });

  lista.sort((a, b) => {
    return (
      a.carrera.localeCompare(b.carrera, "es", { sensitivity: "base" }) ||
      a.turno.localeCompare(b.turno, "es", { sensitivity: "base" }) ||
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    );
  });

  return lista;
}

/**
 * Agrupa los estudiantes analizados por el Código de grupo de la base de datos.
 */
export function obtenerGruposAnalizados(datosEstudiantes) {
  const grupos = new Map();

  (datosEstudiantes || []).forEach((estudiante) => {
    const clave = obtenerClaveGrupo(estudiante);
    if (!clave) return;

    if (!grupos.has(clave)) {
      grupos.set(clave, {
        clave,
        etiqueta: obtenerEtiquetaGrupo(estudiante),
        componentes: obtenerComponentesGrupo(estudiante?.grupoInfo),
        estudiantes: [],
      });
    }

    grupos.get(clave).estudiantes.push(estudiante);
  });

  return Array.from(grupos.values()).sort((a, b) =>
    a.etiqueta.localeCompare(b.etiqueta, "es", {
      sensitivity: "base",
      numeric: true,
    }),
  );
}

/**
 * Detecta el módulo optativo que probablemente cursa un grupo, según la
 * cantidad de actividades aprobadas/realizadas que tenga en cada módulo.
 */
export function detectarModuloOptativoPorGrupo(grupo, optativos) {
  let mejorModulo = optativos[0];
  let mejorPuntaje = -1;

  optativos.forEach((nombreModulo) => {
    let puntaje = 0;

    grupo.estudiantes.forEach((estudiante) => {
      if (estudiante?.estadoEstudiante === "retirado") return;

      const modulo = estudiante?.modulos?.[nombreModulo];
      if (!modulo?.unidades) return;

      Object.values(modulo.unidades).forEach((cuestionarios) => {
        (cuestionarios || []).forEach((cuestionario) => {
          if (
            ["APROBADO", "REALIZADO", "CONVALIDADO"].includes(
              cuestionario.estado,
            )
          ) {
            puntaje += 2;
          } else if (cuestionario.estado === "REPROBADO") {
            puntaje += 1;
          }
        });
      });
    });

    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejorModulo = nombreModulo;
    }
  });

  return mejorModulo;
}

/**
 * Estima cuántas líneas ocupará un texto dentro de una celda con ancho dado,
 * para ajustar la altura de la fila y evitar que se corte el contenido.
 */
function estimarLineas(texto, ancho) {
  if (!texto) return 1;

  return String(texto)
    .split("\n")
    .reduce(
      (max, linea) => Math.max(max, Math.ceil(linea.length / Math.max(ancho - 4, 1))),
      1,
    );
}

/**
 * Calcula la altura necesaria para el título según su ancho real.
 * Si el nombre del centro no cabe en una línea, se permite que ocupe dos
 * o más líneas sin recortar el texto de 48 puntos.
 */
function calcularAlturaTitulo(texto) {
  const anchoDisponible =
    COLUMNAS.reduce((total, columna) => total + columna.width, 0) * 7 + 5;

  // Estimación aproximada para Arial 28 en mayúsculas, usada solo si el
  // navegador no permite medir el texto con canvas.
  let anchoTexto = String(texto).length * 24;

  try {
    if (typeof document !== "undefined" && document.createElement) {
      const canvas = document.createElement("canvas");
      const contexto = canvas.getContext && canvas.getContext("2d");
      if (contexto) {
        contexto.font = `bold ${TAMANO_TITULO}pt Arial`;
        anchoTexto = contexto.measureText(String(texto)).width;
      }
    }
  } catch (error) {
    // Se conserva la estimación aproximada.
  }

  const lineas = Math.max(1, Math.ceil(anchoTexto / anchoDisponible));
  return lineas === 1 ? 44 : 44 + (lineas - 1) * 34;
}

function aplicarRellenoCombinado(worksheet, fila, valor, opciones) {
  const { fuente, relleno, altura } = opciones;

  worksheet.mergeCells(fila, 1, fila, TOTAL_COLUMNAS);

  for (let columna = 1; columna <= TOTAL_COLUMNAS; columna++) {
    const celda = worksheet.getCell(fila, columna);
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: relleno } };
    celda.font = fuente;
    celda.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  }

  const celdaPrincipal = worksheet.getCell(fila, 1);
  celdaPrincipal.value = valor;

  worksheet.getRow(fila).height = altura;
}

function crearBordeDatos() {
  return {
    top: { style: "thin", color: { argb: COLORES.azulBorde } },
    left: { style: "thin", color: { argb: COLORES.azulBorde } },
    bottom: { style: "thin", color: { argb: COLORES.azulBorde } },
    right: { style: "thin", color: { argb: COLORES.azulBorde } },
  };
}

/**
 * Extrae la lista ordenada de cuestionarios de un módulo según la configuración.
 */
function obtenerCuestionariosConfig(configAula, nombreModulo) {
  const unidades = configAula?.modulos?.[nombreModulo] || {};
  const cuestionarios = [];
  let indice = 0;

  Object.entries(unidades).forEach(([unidad, claves]) => {
    (claves || []).forEach((clave) => {
      indice += 1;
      cuestionarios.push({
        indice,
        etiqueta: `A${indice}`,
        unidad,
        clave,
      });
    });
  });

  return cuestionarios;
}

/**
 * Indexa las calificaciones del estudiante por el nombre original del cuestionario.
 */
function indexarCuestionariosEstudiante(estudiante, nombreModulo) {
  const mapa = new Map();
  const modulo = estudiante?.modulos?.[nombreModulo];

  if (modulo?.unidades) {
    Object.values(modulo.unidades).forEach((cuestionarios) => {
      (cuestionarios || []).forEach((cuestionario) => {
        if (cuestionario?.nombreCuestionario) {
          mapa.set(cuestionario.nombreCuestionario, cuestionario);
        }
      });
    });
  }

  return mapa;
}

function calcularPromedioCuestionarios(datos) {
  if (!datos.length) return null;

  const suma = datos.reduce(
    (total, dato) => total + (Number(dato.nota) || 0),
    0,
  );
  return Math.round(suma / datos.length);
}

function aplicarEstiloEncabezado(celda, fuente, relleno) {
  celda.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: relleno },
  };
  celda.font = fuente;
  celda.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  celda.border = {
    top: { style: "thin", color: { argb: COLORES.azulBorde } },
    left: { style: "thin", color: { argb: COLORES.azulBorde } },
    bottom: { style: "medium", color: { argb: COLORES.azulCorporativo } },
    right: { style: "thin", color: { argb: COLORES.azulBorde } },
  };
}

/**
 * Crea la hoja secundaria con el detalle de calificaciones por cuestionario,
 * agrupadas por módulo, y el promedio de cada módulo.
 */
function agregarHojaDetalleCalificaciones(
  workbook,
  pendientes,
  configAula,
  moduloOptativoPorGrupo = {},
) {
  const optativos = obtenerModulosOptativos(configAula);
  const estructuraModulos = Object.keys(configAula?.modulos || {}).map(
    (nombreModulo) => ({
      nombreModulo,
      cuestionarios: obtenerCuestionariosConfig(configAula, nombreModulo),
    }),
  );

  const totalColumnas =
    FIJAS_CALIFICACIONES +
    estructuraModulos.reduce(
      (total, modulo) => total + modulo.cuestionarios.length + 1,
      0,
    );

  const worksheet = workbook.addWorksheet("Calificaciones", {
    views: [{ state: "frozen", xSplit: 4, ySplit: 2 }],
    properties: { defaultRowHeight: 18 },
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      printTitlesRow: "1:2",
      printTitlesColumn: "A:D",
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  worksheet.getColumn(1).width = 34;
  worksheet.getColumn(2).width = 32;
  worksheet.getColumn(COLUMNA_GRUPO).width = 14;
  worksheet.getColumn(4).width = 14;

  let columna = FIJAS_CALIFICACIONES + 1;
  estructuraModulos.forEach((modulo) => {
    modulo.cuestionarios.forEach(() => {
      worksheet.getColumn(columna).width = 8;
      columna += 1;
    });
    worksheet.getColumn(columna).width = 13;
    columna += 1;
  });

  const fuenteEncabezado = {
    name: "Arial",
    size: 10,
    bold: true,
    color: { argb: COLORES.blanco },
  };
  // Columnas fijas: Nombres y apellidos, Carrera, Grupo y Turno. Van en la fila 2 (sin combinar)
  // para que el filtro automático de Grupo quede en el encabezado.
  ["Nombres y apellidos", "Carrera", "Grupo", "Turno"].forEach((titulo, indice) => {
    const numeroColumna = indice + 1;
    aplicarEstiloEncabezado(worksheet.getCell(1, numeroColumna), fuenteEncabezado, COLORES.azulCorporativo);
    aplicarEstiloEncabezado(worksheet.getCell(2, numeroColumna), fuenteEncabezado, COLORES.azulCorporativo);
    worksheet.getCell(2, numeroColumna).value = titulo;
  });

  // Encabezados de módulos y cuestionarios, todos en azul corporativo.
  columna = FIJAS_CALIFICACIONES + 1;
  const rangosModulos = [];
  estructuraModulos.forEach((modulo) => {
    const columnaInicio = columna;
    const columnaPromedio = columnaInicio + modulo.cuestionarios.length;
    const columnaFin = columnaPromedio;
    rangosModulos.push({ inicio: columnaInicio, fin: columnaFin });

    if (columnaFin > columnaInicio) {
      worksheet.mergeCells(1, columnaInicio, 1, columnaFin);
    }

    for (let c = columnaInicio; c <= columnaFin; c++) {
      aplicarEstiloEncabezado(
        worksheet.getCell(1, c),
        fuenteEncabezado,
        COLORES.azulCorporativo,
      );
    }
    worksheet.getCell(1, columnaInicio).value = modulo.nombreModulo;

    modulo.cuestionarios.forEach((cuestionario, indice) => {
      const celda = worksheet.getCell(2, columnaInicio + indice);
      celda.value = cuestionario.etiqueta;
      aplicarEstiloEncabezado(
        celda,
        fuenteEncabezado,
        COLORES.azulCorporativo,
      );
      celda.note = `${cuestionario.unidad}: ${cuestionario.clave}`;
    });

    const celdaPromedio = worksheet.getCell(2, columnaPromedio);
    celdaPromedio.value = "Nota Módulo";
    aplicarEstiloEncabezado(
      celdaPromedio,
      fuenteEncabezado,
      COLORES.azulCorporativo,
    );
    celdaPromedio.note =
      "Nota del módulo: promedio de sus cuestionarios. Las actividades pendientes cuentan como 0.";

    columna = columnaFin + 1;
  });

  worksheet.getRow(1).height = 46;
  worksheet.getRow(2).height = 22;

  // Filas de estudiantes con el detalle de calificaciones.
  pendientes.forEach((registro, indice) => {
    const fila = worksheet.getRow(3 + indice);
    const optativoSeleccionado = obtenerModuloOptativoSeleccionado(
      registro.estudiante,
      configAula,
      moduloOptativoPorGrupo,
    );
    const valoresFijos = [
      registro.nombre,
      registro.carrera,
      String(registro.claveGrupo || "").toUpperCase(),
      registro.turno,
    ];
    const alineacionesFijas = ["left", "left", "center", "center"];

    valoresFijos.forEach((valor, indiceColumna) => {
      const celda = fila.getCell(indiceColumna + 1);
      celda.value = valor;
      celda.font = {
        name: "Arial",
        size: 10,
        bold: indiceColumna === 0,
        color: { argb: COLORES.texto },
      };
      celda.alignment = {
        horizontal: alineacionesFijas[indiceColumna],
        vertical: "middle",
        wrapText: true,
      };
      celda.border = crearBordeDatos();
    });

    let columnaActual = FIJAS_CALIFICACIONES + 1;

    estructuraModulos.forEach((modulo) => {
      const esOptativo = optativos.includes(modulo.nombreModulo);
      const noSeleccionado =
        optativos.length > 1 &&
        esOptativo &&
        modulo.nombreModulo !== optativoSeleccionado;

      const mapaCalificaciones = indexarCuestionariosEstudiante(
        registro.estudiante,
        modulo.nombreModulo,
      );

      const datos = modulo.cuestionarios.map((cuestionario) => {
        const dato = mapaCalificaciones.get(cuestionario.clave);
        return {
          nota: Math.round(Number(dato?.nota) || 0),
          estado: dato?.estado || "PENDIENTE",
        };
      });

      datos.forEach((dato) => {
        const celda = fila.getCell(columnaActual);
        celda.numFmt = "0";
        celda.alignment = { horizontal: "center", vertical: "middle" };
        celda.border = crearBordeDatos();

        if (noSeleccionado) {
          celda.value = null;
          celda.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: COLORES.noAplicaFondo },
          };
          celda.font = {
            name: "Arial",
            size: 10,
            color: { argb: COLORES.noAplicaTexto },
          };
        } else {
          celda.value = dato.nota;
          celda.font = {
            name: "Arial",
            size: 10,
            color: { argb: COLORES.texto },
          };

          if (dato.estado === "PENDIENTE") {
            celda.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: COLORES.amarillo },
            };
            celda.font = {
              name: "Arial",
              size: 10,
              color: { argb: COLORES.amarilloTexto },
            };
          } else if (dato.estado === "REPROBADO") {
            celda.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: COLORES.rojo },
            };
            celda.font = {
              name: "Arial",
              size: 10,
              color: { argb: COLORES.rojoTexto },
            };
          }
        }

        columnaActual += 1;
      });

      const promedio = noSeleccionado
        ? null
        : calcularPromedioCuestionarios(datos);
      const celdaPromedio = fila.getCell(columnaActual);
      celdaPromedio.numFmt = "0";
      celdaPromedio.alignment = { horizontal: "center", vertical: "middle" };
      celdaPromedio.border = crearBordeDatos();

      if (noSeleccionado) {
        celdaPromedio.value = "N/A";
        celdaPromedio.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLORES.noAplicaFondo },
        };
        celdaPromedio.font = {
          name: "Arial",
          size: 10,
          bold: true,
          color: { argb: COLORES.noAplicaTexto },
        };
        celdaPromedio.note = `No aplica: el grupo ${registro.claveGrupo} cursa ${optativoSeleccionado}.`;
      } else {
        celdaPromedio.value = promedio;
        celdaPromedio.font = {
          name: "Arial",
          size: 10,
          bold: true,
          color: { argb: COLORES.texto },
        };

        const moduloEstudiante =
          registro.estudiante?.modulos?.[modulo.nombreModulo];
        const moduloPendiente =
          !moduloEstudiante ||
          (!moduloEstudiante.completado && !moduloEstudiante.estaConvalidado);

        if (moduloPendiente && promedio !== null) {
          const reprobado = promedio < 60;
          celdaPromedio.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: reprobado ? COLORES.rojo : COLORES.amarillo,
            },
          };
          celdaPromedio.font = {
            name: "Arial",
            size: 10,
            bold: true,
            color: {
              argb: reprobado ? COLORES.rojoTexto : COLORES.amarilloTexto,
            },
          };
        }
      }

      columnaActual += 1;
    });

    const lineas = Math.max(
      estimarLineas(registro.nombre, 30),
      estimarLineas(registro.carrera, 28),
    );
    fila.height = Math.max(22, lineas * 13 + 6);
  });

  // Límites entre módulos: línea gruesa en el borde izquierdo y derecho de cada módulo, de arriba abajo
  rangosModulos.forEach(({ inicio, fin }) => {
    for (let fila = 1; fila <= 2 + pendientes.length; fila++) {
      const celdaInicio = worksheet.getCell(fila, inicio);
      celdaInicio.border = { ...celdaInicio.border, left: LINEA_MODULO };
      const celdaFin = worksheet.getCell(fila, fin);
      celdaFin.border = { ...celdaFin.border, right: LINEA_MODULO };
    }
  });

  const ultimaFila = 2 + pendientes.length;
  const ultimaColumna = worksheet.getColumn(totalColumnas).letter;
  worksheet.pageSetup.printArea = `A1:${ultimaColumna}${ultimaFila}`;

  // Filtro automático por defecto en la columna Grupo
  worksheet.autoFilter = {
    from: { row: 2, column: COLUMNA_GRUPO },
    to: { row: ultimaFila, column: COLUMNA_GRUPO },
  };

  return worksheet;
}

/**
 * Genera y descarga el archivo Excel con el registro de notificación.
 */
export async function exportarPendientesExcel(
  datosEstudiantes,
  configAula,
  nombreCentro,
  moduloOptativoPorGrupo = {},
) {
  if (typeof ExcelJS === "undefined") {
    throw new Error(
      "La librería ExcelJS no está disponible. Verifique su conexión a internet y recargue la página.",
    );
  }

  const pendientes = obtenerEstudiantesPendientes(
    datosEstudiantes,
    configAula,
    moduloOptativoPorGrupo,
  );
  if (pendientes.length === 0) {
    throw new Error("No hay estudiantes con módulos pendientes para exportar.");
  }

  const centro = nombreCentroPorCodigo(nombreCentro);

  const fechaExportacion = new Date();
  const fechaNotificacion = formatearFechaNotificacion(fechaExportacion);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Anali-TIC";
  workbook.created = fechaExportacion;

  const worksheet = workbook.addWorksheet("Módulos Pendientes", {
    views: [{ state: "frozen", ySplit: FILA_ENCABEZADO }],
    properties: { defaultRowHeight: 18 },
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      printTitlesRow: "1:4",
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  // Anchos de columna
  COLUMNAS.forEach((columna, indice) => {
    worksheet.getColumn(indice + 1).width = columna.width;
  });

  // Fila 1: título central combinado
  aplicarRellenoCombinado(worksheet, 1, centro, {
    relleno: COLORES.azulCorporativo,
    altura: calcularAlturaTitulo(centro),
    fuente: {
      name: "Arial",
      size: TAMANO_TITULO,
      bold: true,
      color: { argb: COLORES.blanco },
    },
  });

  // Fila 2: subtítulo combinado
  aplicarRellenoCombinado(
    worksheet,
    2,
    "REGISTRO DE NOTIFICACIÓN DE MÓDULOS TRANSVERSALES PENDIENTES",
    {
      relleno: COLORES.azulCorporativo,
      altura: 24,
      fuente: {
        name: "Arial",
        size: 13,
        bold: true,
        color: { argb: COLORES.blanco },
      },
    },
  );

  // Fila 3: separación
  worksheet.getRow(3).height = 10;

  // Fila 4: encabezados de columnas
  const filaEncabezado = worksheet.getRow(FILA_ENCABEZADO);
  filaEncabezado.height = 46;

  COLUMNAS.forEach((columna, indice) => {
    const celda = filaEncabezado.getCell(indice + 1);
    celda.value = columna.header;
    celda.font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: COLORES.azulCorporativo },
    };
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES.azulClaro },
    };
    celda.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    celda.border = {
      top: { style: "thin", color: { argb: COLORES.azulBorde } },
      left: { style: "thin", color: { argb: COLORES.azulBorde } },
      bottom: { style: "medium", color: { argb: COLORES.azulCorporativo } },
      right: { style: "thin", color: { argb: COLORES.azulBorde } },
    };
  });

  // Filas de datos
  pendientes.forEach((registro, indice) => {
    const numeroFila = FILA_PRIMER_DATO + indice;
    const fila = worksheet.getRow(numeroFila);
    const modulosTexto = registro.modulosPendientes.join(", ");

    const valores = [
      indice + 1,
      registro.carrera,
      String(registro.claveGrupo || "").toUpperCase(),
      registro.turno,
      registro.nombre,
      modulosTexto,
      registro.modulosPendientes.length,
      fechaNotificacion,
      null,
      null,
    ];

    const lineasNecesarias = Math.max(
      estimarLineas(registro.carrera, COLUMNAS[1].width),
      estimarLineas(registro.claveGrupo, COLUMNAS[2].width),
      estimarLineas(registro.nombre, COLUMNAS[4].width),
      estimarLineas(modulosTexto, COLUMNAS[5].width),
    );
    fila.height = Math.max(24, lineasNecesarias * 14 + 6);

    valores.forEach((valor, indiceColumna) => {
      const celda = fila.getCell(indiceColumna + 1);
      const configuracion = COLUMNAS[indiceColumna];

      celda.value = valor;
      celda.font = {
        name: "Arial",
        size: 10,
        bold: indiceColumna === 4,
        color: { argb: COLORES.texto },
      };
      celda.alignment = {
        horizontal: configuracion.align,
        vertical: "middle",
        wrapText: true,
      };
      celda.border = {
        top: { style: "thin", color: { argb: COLORES.azulBorde } },
        left: { style: "thin", color: { argb: COLORES.azulBorde } },
        bottom: { style: "thin", color: { argb: COLORES.azulBorde } },
        right: { style: "thin", color: { argb: COLORES.azulBorde } },
      };

      if (indice % 2 === 1) {
        celda.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: COLORES.banda },
        };
      }
    });
  });

  const ultimaFila = FILA_PRIMER_DATO + pendientes.length - 1;

  // Filtro automático por defecto en la columna Grupo
  worksheet.autoFilter = {
    from: { row: FILA_ENCABEZADO, column: COLUMNA_GRUPO },
    to: { row: ultimaFila, column: COLUMNA_GRUPO },
  };

  // Área de impresión
  worksheet.pageSetup.printArea = `A1:${worksheet.getColumn(TOTAL_COLUMNAS).letter}${ultimaFila}`;

  // Hoja secundaria: detalle de calificaciones por cuestionario y módulo.
  agregarHojaDetalleCalificaciones(
    workbook,
    pendientes,
    configAula,
    moduloOptativoPorGrupo,
  );

  // Generar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fechaArchivo = `${fechaExportacion.getFullYear()}-${String(
    fechaExportacion.getMonth() + 1,
  ).padStart(2, "0")}-${String(fechaExportacion.getDate()).padStart(2, "0")}`;
  const horaArchivo = `${String(fechaExportacion.getHours()).padStart(
    2,
    "0",
  )}-${String(fechaExportacion.getMinutes()).padStart(2, "0")}`;

  const centroArchivo = centro
    .replace(/[ÁÀÄÂ]/gi, "A")
    .replace(/[ÉÈËÊ]/gi, "E")
    .replace(/[ÍÌÏÎ]/gi, "I")
    .replace(/[ÓÒÖÔ]/gi, "O")
    .replace(/[ÚÙÜÛ]/gi, "U")
    .replace(/Ñ/gi, "N")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

  const nombreArchivo = `Notificacion_Modulos_Pendientes_${centroArchivo}_${fechaArchivo}_${horaArchivo}.xlsx`;

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 1500);

  return pendientes.length;
}

/**
 * Abre el modal de configuración de la exportación y vincula el botón de descarga.
 */
export function mostrarModalExportacionPendientes(datosEstudiantes, configAula) {
  const modalEl = document.getElementById("modalExportarPendientes");
  if (!modalEl) return;

  const selectorCentro = document.getElementById("export-centro-selector");
  const contador = document.getElementById("export-pendientes-count");
  const btnConfirmar = document.getElementById("btn-confirmar-exportacion");
  const seccionGrupos = document.getElementById(
    "export-grupos-opcionales-container",
  );
  const contenedorGrupos = document.getElementById("export-grupos-opcionales");

  const optativos = obtenerModulosOptativos(configAula);
  const grupos = obtenerGruposAnalizados(datosEstudiantes);

  if (selectorCentro && !selectorCentro.value) {
    selectorCentro.value = centroPredominante(datosEstudiantes) || CENTRO_POR_DEFECTO;
  }

  // Listado de grupos y selección del módulo optativo que cursa cada uno.
  if (optativos.length > 1 && seccionGrupos && contenedorGrupos) {
    seccionGrupos.classList.remove("d-none");
    contenedorGrupos.innerHTML = grupos
      .map((grupo) => {
        const seleccionado = detectarModuloOptativoPorGrupo(grupo, optativos);
        const claveSegura = escaparHtml(grupo.clave);
        const etiquetaSegura = escaparHtml(grupo.etiqueta);

        return `
          <div class="export-grupo-fila py-2 border-bottom">
            <div class="export-grupo-etiqueta small" title="${etiquetaSegura}">
              <span class="badge text-bg-light border">${escaparHtml(grupo.componentes.numeroGrupo || "Sin grupo")}</span>
              <span class="fw-semibold">${escaparHtml(grupo.componentes.carrera || "Carrera no disponible")}</span>
              ${grupo.componentes.codigoGrupo
                ? `<span class="text-muted">Código: <strong>${escaparHtml(grupo.componentes.codigoGrupo)}</strong></span>`
                : ""}
            </div>
            <select class="form-select form-select-sm" data-grupo="${claveSegura}" aria-label="Módulo optativo para ${etiquetaSegura}">
              ${optativos
                .map(
                  (nombre) => `
                <option value="${escaparHtml(nombre)}" ${
                  nombre === seleccionado ? "selected" : ""
                }>${escaparHtml(nombre)}</option>
              `,
                )
                .join("")}
            </select>
          </div>
        `;
      })
      .join("");
  } else if (seccionGrupos) {
    seccionGrupos.classList.add("d-none");
    if (contenedorGrupos) contenedorGrupos.innerHTML = "";
  }

  const leerSelecciones = () => {
    const selecciones = {};
    if (!contenedorGrupos) return selecciones;

    contenedorGrupos
      .querySelectorAll("select[data-grupo]")
      .forEach((select) => {
        selecciones[select.getAttribute("data-grupo")] = select.value;
      });

    return selecciones;
  };

  const actualizarResumen = () => {
    const selecciones = leerSelecciones();
    const pendientes = obtenerEstudiantesPendientes(
      datosEstudiantes,
      configAula,
      selecciones,
    );

    if (contador) contador.textContent = String(pendientes.length);
    if (btnConfirmar) btnConfirmar.disabled = pendientes.length === 0;

    return pendientes;
  };

  if (contenedorGrupos) {
    contenedorGrupos
      .querySelectorAll("select[data-grupo]")
      .forEach((select) => {
        select.onchange = () => {
          actualizarResumen();
          pulsar(select);
          toast(`Módulo optativo: ${select.value}`, "info");
        };
      });
  }

  actualizarResumen();

  if (btnConfirmar) {
    btnConfirmar.onclick = async () => {
      const textoOriginal = btnConfirmar.innerHTML;
      btnConfirmar.disabled = true;
      btnConfirmar.innerHTML =
        '<span class="spinner-border spinner-border-sm me-1"></span> Generando...';

      try {
        const centroSeleccionado = selectorCentro
          ? selectorCentro.value
          : CENTRO_POR_DEFECTO;
        const selecciones = leerSelecciones();

        await exportarPendientesExcel(
          datosEstudiantes,
          configAula,
          centroSeleccionado,
          selecciones,
        );

        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      } catch (error) {
        console.error("Error al exportar pendientes:", error);
        alert(`No se pudo generar el archivo Excel: ${error.message}`);
      } finally {
        btnConfirmar.innerHTML = textoOriginal;
        actualizarResumen();
      }
    };
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

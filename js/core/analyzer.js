// js/core/analyzer.js
import {
  resolverCentro,
  resolverCarrera,
  resolverNombreCortoCarrera,
  contrasenaPorDefecto,
} from "./diccionarios.js";

/**
 * Busca de forma flexible valores en objetos de Excel sin importar tildes o mayúsculas.
 */
export function obtenerValorCampo(obj, posiblesClaves, valorDefecto = "") {
  if (!obj || typeof obj !== "object") return valorDefecto;

  const mapaObjeto = new Map();
  for (const [key, val] of Object.entries(obj)) {
    const claveLimpia = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "")
      .trim();
    mapaObjeto.set(claveLimpia, val);
  }

  for (const clave of posiblesClaves) {
    if (!clave) continue;
    const claveBuscada = String(clave)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "")
      .trim();

    if (mapaObjeto.has(claveBuscada)) {
      const valor = mapaObjeto.get(claveBuscada);
      if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
        return String(valor).trim();
      }
    }
  }

  return valorDefecto;
}

export const CLAVES_CORREO = [
  "correo",
  "direccion de correo",
  "email",
  "email address",
  "direccion de correo electronico",
  "correo electronico",
  "mail",
];

function deducirTurno(texto) {
  const t = (texto || "").toUpperCase();
  if (t.includes("MATUTINO") || t.includes("DIURNO")) return "MATUTINO";
  if (t.includes("VESPERTINO")) return "VESPERTINO";
  if (t.includes("SABATINO")) return "SABATINO";
  if (t.includes("DOMINICAL")) return "DOMINICAL";
  if (t.includes("NOCTURNO")) return "NOCTURNO";
  if (t.includes("VIRTUAL")) return "VIRTUAL";
  return "GENERAL";
}

function limpiarTextoGrupo(texto) {
  if (!texto) return "GENERAL";
  return texto
    .replace(/^[,;.\s]+|[,;.\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const CLAVES_NOMBRE_COMPLETO = [
  "protagonista",
  "nombres y apellidos",
  "nombre y apellidos",
  "nombre completo",
];

/**
 * Convierte el turno de la base de datos a su valor institucional.
 */
function normalizarTurno(texto) {
  const t = String(texto || "").toUpperCase().trim();
  if (!t) return "";
  if (t.includes("MATUTINO") || t.includes("DIURNO")) return "MATUTINO";
  if (t.includes("VESPERTINO")) return "VESPERTINO";
  if (t.includes("NOCTURNO")) return "NOCTURNO";
  if (t.includes("SABATINO")) return "SABATINO";
  if (t.includes("DOMINICAL")) return "DOMINICAL";
  if (t.includes("VIRTUAL")) return "VIRTUAL";
  return t;
}

/**
 * Analiza un conjunto individual de datos de aula.
 */
export function analizarEstudiantes(datosDB, datosCalificaciones, configAula) {
  const correosIgnorados = [
    "renaldy.sanchez@tecnacional.edu.ni",
    "mitjoa307@gmail.com",
    "olivasc226@gmail.com",
    "djvg123@gmail.com"
  ];

  // 1. Agrupar Base de Datos por Correo (guarda arreglos de registros duplicados legítimos)
  const dbMap = new Map();
  if (Array.isArray(datosDB)) {
    datosDB.forEach((est) => {
      const correo = obtenerValorCampo(est, CLAVES_CORREO).toLowerCase();
      if (correo) {
        if (!dbMap.has(correo)) {
          dbMap.set(correo, []);
        }
        dbMap.get(correo).push(est);
      }
    });
  }

  const tipoAula = (configAula && configAula.tipo) ? String(configAula.tipo).toLowerCase().trim() : "modulo";
  const modulosAulaNombres = Object.keys(configAula?.modulos || {}).map(m => m.toLowerCase());

  // 2. Extraer contexto de grupos del archivo de calificaciones actual
  const gruposFrecuencia = new Map();
  datosCalificaciones.forEach((estCal) => {
    const g = obtenerValorCampo(estCal, ["grupo", "grupos"]);
    if (g) {
      const gLimpio = limpiarTextoGrupo(g);
      gruposFrecuencia.set(gLimpio, (gruposFrecuencia.get(gLimpio) || 0) + 1);
    }
  });

  return datosCalificaciones
    .filter((estCal) => {
      const correo = obtenerValorCampo(estCal, CLAVES_CORREO).toLowerCase();
      return correo && !correosIgnorados.includes(correo);
    })
    .map((estCal) => {
      const correo = obtenerValorCampo(estCal, CLAVES_CORREO).toLowerCase();
      const registrosCandidatos = dbMap.get(correo) || [];
      
      let infoEstudiante = null;
      let duplicadoSinCoincidenciaClara = false;

      if (registrosCandidatos.length === 1) {
        infoEstudiante = registrosCandidatos[0];
      } else if (registrosCandidatos.length > 1) {
        // DISCRIMINACIÓN INTELIGENTE DE DUPLICADOS (Ej: KATY)
        const grupoCalRaw = obtenerValorCampo(estCal, ["grupo", "grupos"]);
        const grupoCal = grupoCalRaw ? limpiarTextoGrupo(grupoCalRaw).toLowerCase() : "";

        // Intentar coincidencia exacta con el grupo que viene en la hoja de calificaciones
        if (grupoCal) {
          infoEstudiante = registrosCandidatos.find((cand) => {
            const gCand = obtenerValorCampo(cand, [
              "grupo",
              "grupos",
              "carrera",
              "codigo",
              "código",
            ]).toLowerCase();
            return gCand.includes(grupoCal) || grupoCal.includes(gCand);
          });
        }

        // Si no hubo coincidencia por grupo directo, buscar por coincidencia con el nombre del módulo/curso
        if (!infoEstudiante) {
          infoEstudiante = registrosCandidatos.find((cand) => {
            const gCand = obtenerValorCampo(cand, [
              "grupo",
              "grupos",
              "carrera",
              "codigo",
              "código",
            ]).toLowerCase();
            return modulosAulaNombres.some(
              (modNombre) => gCand.includes(modNombre) || modNombre.includes(gCand),
            );
          });
        }

        // Fallback: seleccionar la fila cuya propiedad de grupo coincida con el grupo predominantemente masivo en las notas
        if (!infoEstudiante) {
          infoEstudiante = registrosCandidatos.find((cand) => {
            const gCand = limpiarTextoGrupo(
              obtenerValorCampo(cand, [
                "grupo",
                "grupos",
                "carrera",
                "codigo",
                "código",
              ]),
            );
            return gruposFrecuencia.has(gCand);
          });
        }

        // Fallback final: primer registro
        if (!infoEstudiante) {
          infoEstudiante = registrosCandidatos[0];
          duplicadoSinCoincidenciaClara = true;
        }
      }

      const protagonistaCal = obtenerValorCampo(estCal, CLAVES_NOMBRE_COMPLETO);
      const nombreCal = obtenerValorCampo(estCal, [
        "nombre",
        "nombres",
        "first name",
      ]);
      const apellidosCal = obtenerValorCampo(estCal, [
        "apellido(s)",
        "apellidos",
        "last name",
      ]);
      const protagonistaDb = obtenerValorCampo(infoEstudiante, CLAVES_NOMBRE_COMPLETO);
      const nombreDb = obtenerValorCampo(infoEstudiante, [
        "nombre",
        "nombres",
        "first name",
      ]);
      const apellidosDb = obtenerValorCampo(infoEstudiante, [
        "apellido(s)",
        "apellidos",
        "last name",
      ]);

      let nombre;
      let apellidos;

      if (protagonistaCal) {
        nombre = protagonistaCal;
        apellidos = "";
      } else if (nombreCal && apellidosCal) {
        nombre = nombreCal;
        apellidos = apellidosCal;
      } else if (protagonistaDb) {
        nombre = protagonistaDb;
        apellidos = "";
      } else {
        nombre = nombreCal || nombreDb || "Sin nombre";
        apellidos = apellidosCal || apellidosDb || "";
      }

      // Datos académicos de la base de datos.
      const carreraRaw = obtenerValorCampo(infoEstudiante, [
        "carrera",
        "carrera tecnica",
        "programa",
        "especialidad",
      ]);
      const turnoRaw = obtenerValorCampo(infoEstudiante, ["turno"]);
      const codigoRaw = obtenerValorCampo(infoEstudiante, [
        "codigo",
        "código",
        "codigo grupo",
        "codigo de grupo",
      ]);
      const codigoValido =
        codigoRaw && !/^n\/?[da]$/i.test(codigoRaw) ? codigoRaw : "";
      const grupoInternoRaw = obtenerValorCampo(infoEstudiante, ["grupos", "grupo"]);

      const grupoRaw =
        codigoValido ||
        grupoInternoRaw ||
        obtenerValorCampo(estCal, ["grupo", "grupos"]);
      const carreraBase = carreraRaw || grupoInternoRaw || grupoRaw;

      // Centro: código corto de la BD (ctche, subsede, ctfabretto) resuelto con config/diccionarios/centros.json
      const centroRaw = obtenerValorCampo(infoEstudiante, ["centro"]);
      const centroDic = resolverCentro(centroRaw);
      let centroVal = centroDic ? centroDic.nombre : centroRaw;
      let centroCodigo = centroDic ? centroDic.codigo : "";
      let municipioVal = centroDic ? centroDic.municipio : "";

      // Carrera: forma corta de la BD resuelta a nombre completo si existe en carreras.json
      let carreraVal = resolverCarrera(carreraBase) || limpiarTextoGrupo(carreraBase || "GENERAL");
      let carreraCortaVal =
        (carreraRaw &&
          (resolverNombreCortoCarrera(carreraRaw) || carreraVal)) ||
        "";
      let numeroGrupoVal = limpiarTextoGrupo(grupoInternoRaw || "GENERAL");
      let grupoVal = limpiarTextoGrupo(
        codigoValido || grupoInternoRaw || carreraBase || "GENERAL",
      );
      let codigoVal = codigoValido || grupoInternoRaw || "N/D";
      let turnoVal =
        normalizarTurno(turnoRaw) ||
        deducirTurno(
          [codigoValido, grupoInternoRaw, carreraBase].filter(Boolean).join(" "),
        );
      const diagnosticosGrupo = [];
      if (!infoEstudiante) diagnosticosGrupo.push("No hay fila con ese correo en la base de datos");
      if (duplicadoSinCoincidenciaClara) {
        diagnosticosGrupo.push("Correo duplicado; se eligió la primera fila sin coincidencia clara");
      }
      if (!grupoInternoRaw) diagnosticosGrupo.push("Falta el valor de Grupos");
      if (!carreraRaw) diagnosticosGrupo.push("Falta el valor de Carrera");
      if (!codigoValido) diagnosticosGrupo.push("Falta el valor de Código");
      if (!turnoVal || turnoVal === "GENERAL") diagnosticosGrupo.push("Falta el valor de Turno");
      let etiquetaGrupo = "Sin Grupo Asignado";

      if (infoEstudiante || grupoRaw) {
        if (
          codigoValido &&
          carreraVal !== "GENERAL" &&
          carreraVal !== codigoValido
        ) {
          etiquetaGrupo = `${codigoValido} - ${carreraVal.toUpperCase()}`;
        } else if (
          grupoVal !== "GENERAL" &&
          carreraVal !== "GENERAL" &&
          grupoVal !== carreraVal
        ) {
          etiquetaGrupo = `${grupoVal} - ${carreraVal.toUpperCase()}`;
        } else {
          etiquetaGrupo = grupoVal !== "GENERAL" ? grupoVal : carreraVal;
        }
      }

      const grupoInfo = {
        centro: centroVal,
        centroCodigo,
        municipio: municipioVal,
        turno: turnoVal,
        carrera: carreraVal,
        carreraCorta: carreraCortaVal,
        numeroGrupo: numeroGrupoVal,
        grupo: grupoVal,
        codigo: codigoVal,
        codigoGrupo: codigoValido,
        etiquetaGrupo,
      };

      const contrasenaBd = obtenerValorCampo(infoEstudiante, ["contrasena", "contraseña", "password", "pass"], "");
      const datosContacto = {
        telefono: obtenerValorCampo(infoEstudiante, ["telefono", "celular", "phone"], ""),
        usuario: obtenerValorCampo(infoEstudiante, ["usuario", "username", "user"], ""),
        contrasena: contrasenaBd || contrasenaPorDefecto(),
        contrasenaPorDefecto: !contrasenaBd,
      };

      const estadoEstudiante = obtenerValorCampo(
        infoEstudiante,
        ["estado", "status"],
        "activo"
      ).toLowerCase();

      const convalidaciones = {};
      if (configAula && configAula.convalidaciones_map) {
        for (let modKey in configAula.convalidaciones_map) {
          const campoConv = configAula.convalidaciones_map[modKey];
          const acronimo = campoConv.replace("conv_", "");
          
          const posiblesNombresColumna = [
            campoConv,
            modKey,
            acronimo,
            `conv_${modKey}`,
            `convalidacion ${acronimo}`,
            `convalidacion_${acronimo}`,
          ];

          const valConv = String(
            obtenerValorCampo(infoEstudiante, posiblesNombresColumna)
          )
            .toLowerCase()
            .trim();

          convalidaciones[modKey] = [
            "si", "sí", "true", "1", "s", "convalidado", "convalidada", "x", "c", "ok", "aprobado", "v",
          ].includes(valConv);
        }
      }

      const analisis = {
        nombre,
        apellidos,
        correo,
        infoDb: infoEstudiante,
        grupoInfo,
        datosContacto,
        estadoEstudiante,
        convalidaciones,
        diagnosticosGrupo,
        calificacionesRaw: estCal,
        modulos: {},
      };

      const modulosConfig = configAula && configAula.modulos ? configAula.modulos : {};

      for (let modNombre in modulosConfig) {
        let totalCuestionarios = 0;
        let entregadosCount = 0;
        let unidades = {};

        const estaConvalidado = Boolean(convalidaciones[modNombre]);

        for (let uni in modulosConfig[modNombre]) {
          unidades[uni] = modulosConfig[modNombre][uni].map((cuestionarioKey) => {
            totalCuestionarios++;
            let notaRaw = estCal[cuestionarioKey];
            
            let tieneEntrega = !(notaRaw === "-" || notaRaw === null || notaRaw === undefined || String(notaRaw).trim() === "");
            let nota = estaConvalidado
              ? 100
              : tieneEntrega
                ? parseFloat(notaRaw) || 0
                : 0;

            let estadoActividad = "PENDIENTE";

            if (estaConvalidado) {
              estadoActividad = "CONVALIDADO";
              entregadosCount++;
            } else if (tipoAula === "curso") {
              if (tieneEntrega) {
                estadoActividad = "REALIZADO";
                entregadosCount++;
              } else {
                estadoActividad = "PENDIENTE";
              }
            } else {
              if (nota >= 60) {
                estadoActividad = "APROBADO";
                entregadosCount++;
              } else if (tieneEntrega) {
                estadoActividad = "REPROBADO";
              } else {
                estadoActividad = "PENDIENTE";
              }
            }

            return {
              nombreCuestionario: cuestionarioKey,
              nota,
              estado: estadoActividad,
            };
          });
        }

        const porcentajeAvance =
          totalCuestionarios > 0
            ? (entregadosCount / totalCuestionarios) * 100
            : 0;

        const completado =
          estaConvalidado ||
          (totalCuestionarios > 0 && entregadosCount === totalCuestionarios);

        let badgeEstado = "PENDIENTE";
        if (analisis.estadoEstudiante === "retirado") {
          badgeEstado = "RETIRADO";
        } else if (estaConvalidado) {
          badgeEstado = "CONVALIDADO";
        } else if (completado) {
          badgeEstado = "COMPLETADO";
        } else if (porcentajeAvance >= 50) {
          badgeEstado = "PENDIENTE";
        }

        analisis.modulos[modNombre] = {
          completado,
          porcentajeAvance,
          badgeEstado,
          estaConvalidado,
          totalCuestionarios,
          unidades,
        };
      }

      return analisis;
    });
}

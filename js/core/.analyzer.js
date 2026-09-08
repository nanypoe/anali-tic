// js/core/analyzer.js

/**
 * Carga asíncrona del diccionario máster de grupos transversales desde JSON.
 */
export async function cargarDiccionarioGruposMaster() {
  try {
    const response = await fetch('./config/grupos/transversales_2026.json');
    if (!response.ok) {
      console.warn("No se pudo cargar el JSON máster de grupos.");
      return {};
    }
    return await response.json();
  } catch (error) {
    console.warn("Error al cargar config/grupos/transversales_2026.json:", error);
    return {};
  }
}

/**
 * Busca de forma flexible valores en objetos de Excel sin importar tildes o mayúsculas.
 */
function obtenerValorCampo(obj, posiblesClaves, valorDefecto = "") {
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

const CLAVES_CORREO = [
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
  return "GENERAL";
}

function limpiarTextoGrupo(texto) {
  if (!texto) return "GENERAL";
  return texto
    .replace(/^[,;.\s]+|[,;.\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Analiza un conjunto individual de datos de aula.
 */
export function analizarEstudiantes(datosDB, datosCalificaciones, configAula, mapaGruposMaster = null) {
  const correosIgnorados = [
    "renaldy.sanchez@tecnacional.edu.ni",
    "mitjoa307@gmail.com",
    "olivasc226@gmail.com",
    "djvg123@gmail.com"
  ];

  const dbMap = new Map();
  if (Array.isArray(datosDB)) {
    datosDB.forEach((est) => {
      const correo = obtenerValorCampo(est, CLAVES_CORREO).toLowerCase();
      if (correo) {
        dbMap.set(correo, est);
      }
    });
  }

  // Identificamos el tipo de aula ("modulo" o "curso"). Fallback a "modulo" si no viene definido.
  const tipoAula = (configAula && configAula.tipo) ? String(configAula.tipo).toLowerCase().trim() : "modulo";

  return datosCalificaciones
    .filter((estCal) => {
      const correo = obtenerValorCampo(estCal, CLAVES_CORREO).toLowerCase();
      return correo && !correosIgnorados.includes(correo);
    })
    .map((estCal) => {
      const correo = obtenerValorCampo(estCal, CLAVES_CORREO).toLowerCase();
      const infoEstudiante = dbMap.get(correo) || null;

      const nombre =
        obtenerValorCampo(estCal, ["nombre", "nombres", "first name", "protagonista"]) ||
        obtenerValorCampo(infoEstudiante, ["nombre", "nombres", "first name"], "Sin nombre");

      const apellidos =
        obtenerValorCampo(estCal, ["apellido(s)", "apellidos", "last name"]) ||
        obtenerValorCampo(infoEstudiante, ["apellido(s)", "apellidos", "last name"], "");

      const grupoRaw = obtenerValorCampo(infoEstudiante, ["grupo", "grupos", "carrera"]) ||
                       obtenerValorCampo(estCal, ["grupo", "grupos"]);
      const carreraRaw = obtenerValorCampo(infoEstudiante, ["carrera", "grupo", "grupos"]);

      const coincidenciaCodigo = (grupoRaw + " " + carreraRaw).match(/G\d+/i);
      const codigoMasterClave = coincidenciaCodigo ? coincidenciaCodigo[0].toUpperCase() : null;

      let centroVal = "CT Che Guevara";
      let municipioVal = "Somoto";
      let carreraVal = limpiarTextoGrupo(carreraRaw || grupoRaw || "GENERAL");
      let grupoVal = limpiarTextoGrupo(grupoRaw || carreraRaw || "GENERAL");
      let codigoVal = obtenerValorCampo(infoEstudiante, ["codigo", "código"], "N/D");
      let turnoVal = obtenerValorCampo(infoEstudiante, ["turno"]) || deducirTurno(grupoRaw || carreraRaw);
      let etiquetaGrupo = "Sin Grupo Asignado";

      if (codigoMasterClave && mapaGruposMaster && mapaGruposMaster[codigoMasterClave]) {
        const infoMaster = mapaGruposMaster[codigoMasterClave];
        centroVal = infoMaster.centro || centroVal;
        municipioVal = infoMaster.municipio || municipioVal;
        carreraVal = infoMaster.carrera || carreraVal;
        codigoVal = infoMaster.codigo || codigoVal;
        turnoVal = infoMaster.turno || turnoVal;
        grupoVal = codigoMasterClave;
        etiquetaGrupo = `${codigoMasterClave} - ${carreraVal} (${centroVal} - ${municipioVal})`;
      } else if (infoEstudiante || grupoRaw) {
        if (grupoVal !== "GENERAL" && carreraVal !== "GENERAL" && grupoVal !== carreraVal) {
          etiquetaGrupo = `${grupoVal} - ${carreraVal.toUpperCase()}`;
        } else {
          etiquetaGrupo = grupoVal !== "GENERAL" ? grupoVal : carreraVal;
        }
      }

      const grupoInfo = {
        centro: centroVal,
        municipio: municipioVal,
        turno: turnoVal,
        carrera: carreraVal,
        grupo: grupoVal,
        codigo: codigoVal,
        etiquetaGrupo,
      };

      const datosContacto = {
        telefono: obtenerValorCampo(infoEstudiante, ["telefono", "celular", "phone"], ""),
        usuario: obtenerValorCampo(infoEstudiante, ["usuario", "username", "user"], ""),
        contrasena: obtenerValorCampo(infoEstudiante, ["contrasena", "password", "pass"], ""),
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
        calificacionesRaw: estCal,
        modulos: {},
      };

      const modulosConfig = configAula && configAula.modulos ? configAula.modulos : {};

      for (let modNombre in modulosConfig) {
        let totalCuestionarios = 0;
        let entregadosCount = 0; // Cuenta actividades realizadas (en cursos) o aprobadas (en módulos)
        let unidades = {};

        const estaConvalidado = Boolean(convalidaciones[modNombre]);

        for (let uni in modulosConfig[modNombre]) {
          unidades[uni] = modulosConfig[modNombre][uni].map((cuestionarioKey) => {
            totalCuestionarios++;
            let notaRaw = estCal[cuestionarioKey];
            
            // Verificamos si existe un valor/nota registrada distinta de vacío o "-"
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
              // Lógica de CURSO: Presencia de dato numérico/nota indica realización
              if (tieneEntrega) {
                estadoActividad = "REALIZADO";
                entregadosCount++;
              } else {
                estadoActividad = "PENDIENTE";
              }
            } else {
              // Lógica de MÓDULO: Cuantitativa rígida (>= 60)
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

/**
 * Valida si la nueva aula es del mismo tipo y combina sus estudiantes con la lista actual.
 */
export function cruzarDatosNuevasAulas(
  estudiantesExistentes,
  configAulaActual,
  nuevosDatosDB,
  nuevosDatosCalificaciones,
  nuevaConfigAula,
  mapaGruposMaster
) {
  const modulosActuales = Object.keys(configAulaActual.modulos || {}).sort().join("|");
  const modulosNuevos = Object.keys(nuevaConfigAula.modulos || {}).sort().join("|");

  if (modulosActuales !== modulosNuevos) {
    throw new Error(
      `Conflicto de Estructura: El archivo cargado pertenece a un tipo de aula distinto. ` +
      `Se esperaba un aula compatible con [${Object.keys(configAulaActual.modulos).join(", ")}].`
    );
  }

  const nuevosEstudiantes = analizarEstudiantes(
    nuevosDatosDB,
    nuevosDatosCalificaciones,
    nuevaConfigAula,
    mapaGruposMaster
  );

  const mapaUnico = new Map();
  estudiantesExistentes.forEach((e) => mapaUnico.set(e.correo.toLowerCase(), e));
  nuevosEstudiantes.forEach((e) => mapaUnico.set(e.correo.toLowerCase(), e));

  return Array.from(mapaUnico.values());
}
// js/core/analyzer.js

/**
 * Función auxiliar para obtener de forma flexible el valor de un objeto
 * buscando entre múltiples variantes de nombres de columnas.
 * Insensible a mayúsculas, minúsculas, tildes, espacios extra y símbolos.
 */
function obtenerValorCampo(obj, posiblesClaves, valorDefecto = "") {
  if (!obj || typeof obj !== "object") return valorDefecto;

  const mapaObjeto = new Map();
  for (const [key, val] of Object.entries(obj)) {
    const claveLimpia = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "") // ¡AGREGAMOS EL GUION BAJO AQUÍ!
      .trim();
    mapaObjeto.set(claveLimpia, val);
  }

  for (const clave of posiblesClaves) {
    if (!clave) continue;
    const claveBuscada = String(clave)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "") // ¡Y AQUÍ!
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
/**
 * Lista unificada de cabeceras de Correo Electrónico
 */
const CLAVES_CORREO = [
  "correo",
  "direccion de correo",
  "email",
  "email address",
  "direccion de correo electronico",
  "correo electronico",
  "mail",
];

/**
 * Deduce el turno buscando palabras clave dentro de las cadenas de grupo/carrera.
 */
function deducirTurno(texto) {
  const t = (texto || "").toUpperCase();
  if (t.includes("DIURNO")) return "DIURNO";
  if (t.includes("SABATINO")) return "SABATINO";
  if (t.includes("DOMINICAL")) return "DOMINICAL";
  if (t.includes("NOCTURNO")) return "NOCTURNO";
  return "GENERAL";
}

/**
 * Limpia y normaliza el texto de grupos/carreras eliminando caracteres extraños o comas sobrantes.
 */
function limpiarTextoGrupo(texto) {
  if (!texto) return "GENERAL";
  return texto
    .replace(/^[,;.\s]+|[,;.\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function analizarEstudiantes(datosDB, datosCalificaciones, configAula) {
  const correosIgnorados = [
    "renaldy.sanchez@tecnacional.edu.ni",
    "mitjoa307@gmail.com",
  ];

  // 1. Mapear Base de Datos por correo electrónico
  const dbMap = new Map();
  if (Array.isArray(datosDB)) {
    datosDB.forEach((est) => {
      const correo = obtenerValorCampo(est, CLAVES_CORREO).toLowerCase();
      if (correo) {
        dbMap.set(correo, est);
      }
    });
  }

  // 2. Procesar expediente de cada estudiante
  return datosCalificaciones
    .filter((estCal) => {
      const correo = obtenerValorCampo(estCal, CLAVES_CORREO).toLowerCase();
      return correo && !correosIgnorados.includes(correo);
    })
    .map((estCal) => {
      const correo = obtenerValorCampo(estCal, CLAVES_CORREO).toLowerCase();
      const infoEstudiante = dbMap.get(correo) || null;

      // 1.1 Normalización de Datos Personales
      const nombre =
        obtenerValorCampo(estCal, ["nombre", "nombres", "first name", "protagonista"]) ||
        obtenerValorCampo(infoEstudiante, ["nombre", "nombres", "first name"], "Sin nombre");

      const apellidos =
        obtenerValorCampo(estCal, ["apellido(s)", "apellidos", "last name"]) ||
        obtenerValorCampo(infoEstudiante, ["apellido(s)", "apellidos", "last name"], "");

      // 1.2 y 1.3 Grupos y Turno
      const grupoRaw = obtenerValorCampo(infoEstudiante, ["grupo", "grupos", "carrera"]);
      const carreraRaw = obtenerValorCampo(infoEstudiante, ["carrera", "grupo", "grupos"]);

      const turnoVal =
        obtenerValorCampo(infoEstudiante, ["turno"]) ||
        deducirTurno(grupoRaw || carreraRaw);

      const carreraVal = limpiarTextoGrupo(carreraRaw || grupoRaw || "GENERAL");
      const grupoVal = limpiarTextoGrupo(grupoRaw || carreraRaw || "GENERAL");
      const codigoVal = obtenerValorCampo(infoEstudiante, ["codigo", "código"], "N/D");

      let etiquetaGrupo = "Sin Grupo Asignado";
      if (infoEstudiante || grupoRaw) {
        if (grupoVal !== "GENERAL" && carreraVal !== "GENERAL" && grupoVal !== carreraVal) {
          etiquetaGrupo = `${grupoVal} - ${carreraVal.toUpperCase()}`;
        } else {
          etiquetaGrupo = grupoVal !== "GENERAL" ? grupoVal : carreraVal;
        }
      }

      const grupoInfo = {
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

      // Evaluación segura y flexible de convalidaciones
      const convalidaciones = {};
      if (configAula && configAula.convalidaciones_map) {
        for (let modKey in configAula.convalidaciones_map) {
          const campoConv = configAula.convalidaciones_map[modKey]; // ej: "conv_HIN"
          
          // Separemos el acrónimo (ej: "HIN" de "conv_HIN")
          const acronimo = campoConv.replace("conv_", ""); 
          
          const posiblesNombresColumna = [
            campoConv,        // "conv_HIN"
            modKey,           // "Historia e Identidad Nacional"
            acronimo,         // "HIN"
            `conv_${modKey}`, // "conv_Historia e Identidad Nacional"
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
        let aprobadosCount = 0;
        let unidades = {};

        const estaConvalidado = Boolean(convalidaciones[modNombre]);

        for (let uni in modulosConfig[modNombre]) {
          unidades[uni] = modulosConfig[modNombre][uni].map((cuestionarioKey) => {
            totalCuestionarios++;
            let notaRaw = estCal[cuestionarioKey];
            let nota = estaConvalidado
              ? 100
              : notaRaw === "-" || notaRaw === null || notaRaw === undefined || notaRaw === ""
                ? 0
                : parseFloat(notaRaw) || 0;

            if (nota >= 60 || estaConvalidado) aprobadosCount++;

            return {
              nombreCuestionario: cuestionarioKey,
              nota,
              estado: estaConvalidado
                ? "CONVALIDADO"
                : nota >= 60
                  ? "APROBADO"
                  : nota > 0
                    ? "REPROBADO"
                    : "PENDIENTE",
            };
          });
        }

        const porcentajeAvance =
          totalCuestionarios > 0
            ? (aprobadosCount / totalCuestionarios) * 100
            : 0;

        const completado =
          estaConvalidado ||
          (totalCuestionarios > 0 && aprobadosCount === totalCuestionarios);

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
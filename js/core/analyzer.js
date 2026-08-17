// js/core/analyzer.js

/**
 * Función auxiliar para obtener de forma flexible el valor de un objeto
 * buscando entre múltiples variantes de nombres de columnas.
 * Insensible a mayúsculas, minúsculas, tildes y espacios extra.
 */
function obtenerValorCampo(obj, posiblesClaves, valorDefecto = "") {
  if (!obj || typeof obj !== "object") return valorDefecto;

  // Normalizar las claves existentes en el objeto fuente
  const mapaObjeto = new Map();
  for (const [key, val] of Object.entries(obj)) {
    const claveLimpia = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quita tildes
      .trim();
    mapaObjeto.set(claveLimpia, val);
  }

  // Buscar coincidencia en la lista de nombres posibles
  for (const clave of posiblesClaves) {
    const claveBuscada = clave
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
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
    .replace(/^[,;.\s]+|[,;.\s]+$/g, "") // Remueve comas, puntos o espacios al inicio/final
    .replace(/\s+/g, " ")                // Convierte espacios múltiples en uno solo
    .trim();
}

export function analizarEstudiantes(datosDB, datosCalificaciones, configAula) {
  // Correos administrativos o docentes a ignorar
  const correosIgnorados = [
    "renaldy.sanchez@tecnacional.edu.ni",
    "mitjoa307@gmail.com",
  ];

  // 1. Mapear Base de Datos por correo electrónico (con normalización flexible de encabezados)
  const dbMap = new Map();
  if (Array.isArray(datosDB)) {
    datosDB.forEach((est) => {
      const correo = obtenerValorCampo(est, [
        "correo",
        "direccion de correo",
        "email",
        "email address",
        "direccion de correo electronico",
      ]).toLowerCase();

      if (correo) {
        dbMap.set(correo, est);
      }
    });
  }

  // 2. Procesar expediente de cada estudiante filtrando correos ignorados
  return datosCalificaciones
    .filter((estCal) => {
      const correo = obtenerValorCampo(estCal, [
        "direccion de correo",
        "correo",
        "email",
        "email address",
      ]).toLowerCase();

      return correo && !correosIgnorados.includes(correo);
    })
    .map((estCal) => {
      const correo = obtenerValorCampo(estCal, [
        "direccion de correo",
        "correo",
        "email",
        "email address",
      ]).toLowerCase();

      // Buscar coincidencia en la DB cargada
      const infoEstudiante = dbMap.get(correo) || null;

      // 1.1 Normalización de Datos Personales (prioriza archivo de calificaciones, luego DB)
      const nombre =
        obtenerValorCampo(estCal, ["nombre", "nombres", "first name"]) ||
        obtenerValorCampo(infoEstudiante, ["nombre", "nombres", "first name"], "Sin nombre");

      const apellidos =
        obtenerValorCampo(estCal, ["apellido(s)", "apellidos", "last name"]) ||
        obtenerValorCampo(infoEstudiante, ["apellido(s)", "apellidos", "last name"], "");

      // 1.2 y 1.3 Extracción y Fallbacks de Grupos
      const grupoRaw = obtenerValorCampo(infoEstudiante, [
        "grupo",
        "grupos",
        "carrera",
      ]);

      const carreraRaw = obtenerValorCampo(infoEstudiante, [
        "carrera",
        "grupo",
        "grupos",
      ]);

      const turnoVal =
        obtenerValorCampo(infoEstudiante, ["turno"]) ||
        deducirTurno(grupoRaw || carreraRaw);

      const carreraVal = limpiarTextoGrupo(carreraRaw || grupoRaw || "GENERAL");
      const grupoVal = limpiarTextoGrupo(grupoRaw || carreraRaw || "GENERAL");
      const codigoVal = obtenerValorCampo(infoEstudiante, ["codigo", "código"], "N/D");

      // Construcción flexible de la etiqueta de grupo
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

      // Datos de Contacto y Accesos (Fallbacks para DB simplificada)
      const datosContacto = {
        telefono: obtenerValorCampo(infoEstudiante, ["telefono", "celular", "phone"], ""),
        usuario: obtenerValorCampo(infoEstudiante, ["usuario", "username", "user"], ""),
        contrasena: obtenerValorCampo(infoEstudiante, ["contrasena", "password", "pass"], ""),
      };

      // Estado académico del alumno
      const estadoEstudiante = obtenerValorCampo(
        infoEstudiante,
        ["estado", "status"],
        "activo"
      ).toLowerCase();

      // Evaluación segura de convalidaciones
      const convalidaciones = {};
      if (configAula && configAula.convalidaciones_map) {
        for (let modKey in configAula.convalidaciones_map) {
          const campoConv = configAula.convalidaciones_map[modKey];
          const valConv = obtenerValorCampo(infoEstudiante, [campoConv]).toLowerCase();
          convalidaciones[modKey] = ["si", "sí", "true", "1"].includes(valConv);
        }
      }

      // Estructura consolidada del estudiante
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

      // Analizar los módulos según el archivo JSON de configuración del aula
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

            if (nota >= 60) aprobadosCount++;

            return {
              nombreCuestionario: cuestionarioKey,
              nota,
              estado:
                nota >= 60
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
          estaConvalidado || (totalCuestionarios > 0 && aprobadosCount === totalCuestionarios);

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
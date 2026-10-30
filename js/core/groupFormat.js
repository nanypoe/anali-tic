import { resolverNombreCortoCarrera } from "./diccionarios.js";

function limpiarDatoGrupo(valor) {
  const texto = String(valor ?? "").trim();
  return /^(GENERAL|N\/?D|SIN GRUPO(?: ASIGNADO)?)$/i.test(texto) ? "" : texto;
}

function esNumeroGrupo(valor) {
  return /^G\s*[-]?\s*\d+/i.test(valor);
}

export function obtenerComponentesGrupo(grupoInfo = {}) {
  const numeroGrupo = limpiarDatoGrupo(grupoInfo.numeroGrupo) ||
    (esNumeroGrupo(String(grupoInfo.grupo ?? "").trim())
      ? limpiarDatoGrupo(grupoInfo.grupo)
      : "");
  const carreraRaw = limpiarDatoGrupo(grupoInfo.carreraCorta) ||
    limpiarDatoGrupo(grupoInfo.carrera);
  const carrera = limpiarDatoGrupo(
    resolverNombreCortoCarrera(carreraRaw) ||
    resolverNombreCortoCarrera(grupoInfo.carrera) ||
    carreraRaw,
  );
  const codigoDato = limpiarDatoGrupo(grupoInfo.codigoGrupo) ||
    limpiarDatoGrupo(grupoInfo.codigo);
  const codigoGrupo = codigoDato &&
    codigoDato.toLocaleLowerCase("es") !== numeroGrupo.toLocaleLowerCase("es")
    ? codigoDato
    : "";

  return { numeroGrupo, carrera, codigoGrupo };
}

export function formatearEtiquetaGrupo(grupoInfo = {}) {
  const { numeroGrupo, carrera, codigoGrupo } =
    obtenerComponentesGrupo(grupoInfo);
  const etiqueta = [numeroGrupo, carrera, codigoGrupo].filter(Boolean).join(" - ");

  return etiqueta || limpiarDatoGrupo(grupoInfo.etiquetaGrupo) || "Sin grupo";
}

// js/core/preferencias.js

/** Lectura y escritura tolerantes de preferencias del usuario en localStorage. */

export function leerPreferencia(clave) {
  try {
    return localStorage.getItem(clave);
  } catch (error) {
    console.warn(`No se pudo leer la preferencia "${clave}".`, error);
    return null;
  }
}

/** Verdadero cuando el usuario activó "Reducir animaciones" en la cabecera. */
export const animacionesReducidas = () => document.documentElement.classList.contains("reducir-animaciones");

export function guardarPreferencia(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
    return true;
  } catch (error) {
    console.error(`No se pudo guardar la preferencia "${clave}".`, error);
    return false;
  }
}

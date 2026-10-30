/* js/ui/intro.js */

/**
 * Animación de bienvenida: se muestra solo la primera vez que se abre la app
 * en un navegador. Después la pantalla inicial aparece directamente.
 */

import { toast } from "./feedback.js";

const CLAVE = "anali-tic:intro-vista";
const CLAVE_SIEMPRE = "anali-tic:intro-siempre";
const CLAVE_REDUCIR_ANIMACIONES = "anali-tic:reducir-animaciones";
const DURACION_MS = 2500;

function leerPreferencia(clave) {
  try {
    return localStorage.getItem(clave);
  } catch (error) {
    console.warn(`No se pudo leer la preferencia "${clave}".`, error);
    return null;
  }
}

function guardarPreferencia(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
    return true;
  } catch (error) {
    console.error(`No se pudo guardar la preferencia "${clave}".`, error);
    return false;
  }
}

export function inicializarPreferencias() {
  const reducirAnimaciones = document.getElementById("chk-reducir-animaciones");
  const introSiempre = document.getElementById("chk-intro-siempre");
  const reduccionDelSistema = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const preferenciaMovimiento = leerPreferencia(CLAVE_REDUCIR_ANIMACIONES);
  const movimientoReducido = reduccionDelSistema || preferenciaMovimiento === "1";

  document.documentElement.classList.toggle("reducir-animaciones", movimientoReducido);
  if (reducirAnimaciones) {
    reducirAnimaciones.checked = movimientoReducido;
    reducirAnimaciones.disabled = reduccionDelSistema;
    if (reduccionDelSistema) {
      reducirAnimaciones.title = "La preferencia de movimiento reducido del sistema está activa.";
    }
  }
  if (introSiempre) introSiempre.checked = leerPreferencia(CLAVE_SIEMPRE) === "1";

  reducirAnimaciones?.addEventListener("change", () => {
    document.documentElement.classList.toggle("reducir-animaciones", reducirAnimaciones.checked);
    if (!guardarPreferencia(CLAVE_REDUCIR_ANIMACIONES, reducirAnimaciones.checked ? "1" : "0")) {
      reducirAnimaciones.checked = !reducirAnimaciones.checked;
      document.documentElement.classList.toggle("reducir-animaciones", reducirAnimaciones.checked);
      toast("No se pudo guardar la preferencia en este navegador.", "aviso");
    }
  });

  introSiempre?.addEventListener("change", () => {
    if (!guardarPreferencia(CLAVE_SIEMPRE, introSiempre.checked ? "1" : "0")) {
      introSiempre.checked = !introSiempre.checked;
      toast("No se pudo guardar la preferencia en este navegador.", "aviso");
    }
  });
}

export function mostrarIntroPrimeraVez() {
  const splash = document.getElementById("intro-splash");
  if (!splash) return;

  const siempre = leerPreferencia(CLAVE_SIEMPRE) === "1";
  const yaVista = leerPreferencia(CLAVE) === "1";

  if (yaVista && !siempre) {
    splash.remove();
    return;
  }
  guardarPreferencia(CLAVE, "1");

  const movimientoReducido =
    document.documentElement.classList.contains("reducir-animaciones") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => splash.classList.add("visible"));
  setTimeout(() => {
    splash.classList.add("salir");
    if (movimientoReducido) {
      splash.remove();
      return;
    }
    splash.addEventListener("transitionend", () => splash.remove(), { once: true });
    setTimeout(() => splash.remove(), 900);
  }, movimientoReducido ? 600 : DURACION_MS);
}

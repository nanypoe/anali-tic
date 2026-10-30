/* js/ui/tema.js */

/**
 * Modo claro (por defecto) y modo oscuro con la paleta de marca.
 * La elección se guarda en este navegador y se aplica con data-bs-theme,
 * que Bootstrap usa para sus propios componentes.
 */

import { leerPreferencia, guardarPreferencia } from "../core/preferencias.js";

const CLAVE_TEMA = "anali-tic:tema";
export const COLOR_TEXTO_GRAFICO = { claro: "#666666", oscuro: "#CFCBEA" };

function aplicarTema(oscuro) {
  document.documentElement.dataset.bsTheme = oscuro ? "dark" : "light";
  if (window.Chart) Chart.defaults.color = oscuro ? COLOR_TEXTO_GRAFICO.oscuro : COLOR_TEXTO_GRAFICO.claro;

  const boton = document.getElementById("btn-tema");
  if (!boton) return;
  boton.innerHTML = oscuro
    ? `<i class="bi bi-sun-fill me-1"></i> Claro`
    : `<i class="bi bi-moon-stars-fill me-1"></i> Oscuro`;
  boton.setAttribute("aria-pressed", String(oscuro));
}

/**
 * Ejecuta una captura (PNG) con el tema claro, aunque la app esté en oscuro.
 * El tema se restaura al terminar, incluso si la captura falla.
 */
export async function conTemaClaro(captura) {
  if (document.documentElement.dataset.bsTheme !== "dark") return captura();
  aplicarTema(false);
  try {
    return await captura();
  } finally {
    aplicarTema(true);
  }
}

export function inicializarTema() {
  const boton = document.getElementById("btn-tema");
  aplicarTema(leerPreferencia(CLAVE_TEMA) === "oscuro");

  boton?.addEventListener("click", () => {
    const oscuro = document.documentElement.dataset.bsTheme !== "dark";
    aplicarTema(oscuro);
    guardarPreferencia(CLAVE_TEMA, oscuro ? "oscuro" : "claro");
  });
}

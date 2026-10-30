/* js/ui/atajos.js */

/**
 * Atajos de teclado de la pantalla de análisis.
 * Son teclas sueltas (sin Ctrl, Alt ni Meta) que solo actúan cuando hay una
 * pantalla de análisis visible, ningún cuadro de diálogo abierto y el foco no
 * está en un campo de texto. Cada control muestra su atajo al pasar el puntero.
 */

const ATAJOS = [
  { tecla: "B", selector: "#search-input", nombre: "Buscar estudiante" },
  { tecla: "A", selector: "#btn-ver-tabla-grupos", nombre: "Análisis del aula" },
  { tecla: "G", selector: "#btn-gestionar-estudiantes", nombre: "Gestionar" },
  { tecla: "T", selector: "#btn-exportar-tabla", nombre: "Exportar tabla" },
  { tecla: "E", selector: "#btn-exportar-pendientes", nombre: "Exportar pendientes" },
  { tecla: "S", selector: "#btn-esquela-global", nombre: "Esquela" },
  { tecla: "C", selector: "#btn-capturar-tabla", nombre: "Capturar tabla" },
  { tecla: "1", selector: '#pills-estados [data-estado="TODOS"]', nombre: "Todos" },
  { tecla: "2", selector: '#pills-estados [data-estado="COMPLETADO"]', nombre: "Completados" },
  { tecla: "3", selector: '#pills-estados [data-estado="PENDIENTE"]', nombre: "Pendientes" },
  { tecla: "4", selector: '#pills-estados [data-estado="CONVALIDADO"]', nombre: "Convalidados" },
  { tecla: "5", selector: '#pills-estados [data-estado="RETIRADO"]', nombre: "Retirados" },
];

/** Controles de la cabecera y del panel que deliberadamente no tienen atajo. */
const SIN_ATAJO = [
  "#btn-tema",
  "#btn-modo-reporte",
  "#btn-notificaciones",
  "#nav-actions > button",
];

const CAMPOS_DE_TEXTO = "input, select, textarea, [contenteditable]";

function estaVisible(elemento) {
  return Boolean(elemento) && !elemento.disabled && elemento.offsetParent !== null;
}

function activar(elemento) {
  if (elemento.matches("input")) {
    elemento.focus();
    elemento.select();
  } else {
    elemento.click();
  }
}

function alPresionarTecla(evento) {
  if (evento.ctrlKey || evento.metaKey || evento.altKey || evento.repeat) return;
  if (evento.target.closest?.(CAMPOS_DE_TEXTO)) return;
  if (document.querySelector(".modal.show")) return;

  const atajo = ATAJOS.find((a) => a.tecla === evento.key.toUpperCase());
  if (!atajo) return;

  const elemento = document.querySelector(atajo.selector);
  if (!estaVisible(elemento)) return;

  evento.preventDefault();
  activar(elemento);
}

function anunciarAtajos() {
  ATAJOS.forEach(({ tecla, selector, nombre }) => {
    const elemento = document.querySelector(selector);
    if (!elemento) return;
    const base = elemento.getAttribute("title") || nombre;
    elemento.title = `${base} · Atajo: ${tecla}`;
  });

  SIN_ATAJO.forEach((selector) => {
    document.querySelectorAll(selector).forEach((elemento) => {
      const base = elemento.getAttribute("title") || elemento.textContent.trim();
      elemento.title = `${base} · Sin atajo de teclado`;
    });
  });
}

export function inicializarAtajos() {
  anunciarAtajos();
  document.addEventListener("keydown", alPresionarTecla);
}

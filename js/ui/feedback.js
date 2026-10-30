/* js/ui/feedback.js */

/**
 * Retroalimentación visual: avisos flotantes (sustituyen a alert) y pulso
 * al seleccionar una píldora.
 */

const DURACION = { info: 3200, exito: 3200, aviso: 4200, error: 5200 };
const ICONOS = { info: "bi-info-circle-fill", exito: "bi-check-circle-fill", aviso: "bi-exclamation-triangle-fill", error: "bi-x-octagon-fill" };

export function toast(mensaje, tipo = "info") {
  const contenedor = document.getElementById("toast-contenedor");
  if (!contenedor) return;
  const el = document.createElement("div");
  el.className = `toast-anali toast-${tipo}`;
  el.setAttribute("role", "status");
  el.innerHTML = `<i class="bi ${ICONOS[tipo] || ICONOS.info}"></i><span></span>`;
  el.querySelector("span").textContent = mensaje;
  // Como máximo tres avisos a la vez: el más antiguo se retira
  while (contenedor.children.length >= 3) contenedor.firstElementChild.remove();
  contenedor.appendChild(el);
  requestAnimationFrame(() => el.classList.add("visible"));
  setTimeout(() => {
    el.classList.remove("visible");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 600);
  }, DURACION[tipo] || DURACION.info);
}

/** Pulso de confirmación sobre una píldora o botón. */
export function pulsar(elemento) {
  if (!elemento) return;
  elemento.classList.remove("pill-pulso");
  void elemento.offsetWidth; // reinicia la animación
  elemento.classList.add("pill-pulso");
  elemento.addEventListener("animationend", () => elemento.classList.remove("pill-pulso"), { once: true });
}

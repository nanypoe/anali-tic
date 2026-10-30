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
const temporizadoresPulso = new WeakMap();

export function pulsar(elemento) {
  if (!elemento) return;
  clearTimeout(temporizadoresPulso.get(elemento));
  elemento.classList.remove("pill-pulso");
  void elemento.offsetWidth; // reinicia la animación
  elemento.classList.add("pill-pulso");
  const quitarPulso = () => {
    elemento.removeEventListener("animationend", quitarPulso);
    elemento.classList.remove("pill-pulso");
    clearTimeout(temporizadoresPulso.get(elemento));
    temporizadoresPulso.delete(elemento);
  };
  elemento.addEventListener("animationend", quitarPulso, { once: true });
  temporizadoresPulso.set(elemento, setTimeout(quitarPulso, 600));
}

const temporizadoresCopia = new WeakMap();
const clasesIconoOriginales = new WeakMap();

export async function copiarTextoPortapapeles(texto, elemento, mensaje) {
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("El navegador no permite acceder al portapapeles en esta página.");
    }
    await navigator.clipboard.writeText(texto);

    const icono = elemento?.querySelector("i");
    if (icono) {
      if (!temporizadoresCopia.has(elemento)) {
        clasesIconoOriginales.set(elemento, icono.className);
      }
      icono.className = "bi bi-clipboard-check";
      clearTimeout(temporizadoresCopia.get(elemento));
      temporizadoresCopia.set(elemento, setTimeout(() => {
        if (icono.isConnected) icono.className = clasesIconoOriginales.get(elemento);
        temporizadoresCopia.delete(elemento);
        clasesIconoOriginales.delete(elemento);
      }, 1200));
    }
    pulsar(elemento);
    toast(mensaje, "exito");
    return true;
  } catch (error) {
    toast(`No se pudo copiar: ${error.message}`, "error");
    return false;
  }
}

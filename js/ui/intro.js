/* js/ui/intro.js */

/**
 * Animación de bienvenida: se muestra solo la primera vez que se abre la app
 * en un navegador. Después la pantalla inicial aparece directamente.
 */

const CLAVE = "anali-tic:intro-vista";
const DURACION_MS = 1900;

export function mostrarIntroPrimeraVez() {
  const splash = document.getElementById("intro-splash");
  if (!splash) return;

  let yaVista = false;
  try {
    yaVista = localStorage.getItem(CLAVE) === "1";
  } catch (error) {
    yaVista = false;
  }

  if (yaVista) {
    splash.remove();
    return;
  }
  try {
    localStorage.setItem(CLAVE, "1");
  } catch (error) {
    /* sin almacenamiento: la animación simplemente se repetirá */
  }

  requestAnimationFrame(() => splash.classList.add("visible"));
  setTimeout(() => {
    splash.classList.add("salir");
    splash.addEventListener("transitionend", () => splash.remove(), { once: true });
    setTimeout(() => splash.remove(), 900);
  }, DURACION_MS);
}

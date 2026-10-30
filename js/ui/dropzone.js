/* js/ui/dropzone.js */

/**
 * Arrastrar y soltar archivos sobre las tarjetas de carga y actualizar el progreso.
 */

export function activarArrastreArchivos(inputs, onArchivo) {
  inputs.forEach((input) => {
    const tarjeta = input.closest(".upload-card");
    if (!tarjeta) return;

    const evitar = (e) => { e.preventDefault(); e.stopPropagation(); };

    ["dragenter", "dragover"].forEach((ev) =>
      tarjeta.addEventListener(ev, (e) => {
        evitar(e);
        tarjeta.classList.add("arrastrando");
      }),
    );
    ["dragleave", "dragend"].forEach((ev) =>
      tarjeta.addEventListener(ev, (e) => {
        evitar(e);
        tarjeta.classList.remove("arrastrando");
      }),
    );
    tarjeta.addEventListener("drop", (e) => {
      evitar(e);
      tarjeta.classList.remove("arrastrando");
      const archivo = e.dataTransfer?.files?.[0];
      if (!archivo) return;
      if (!/\.(xlsx|ods)$/i.test(archivo.name)) {
        onArchivo(null, "Solo se aceptan archivos .xlsx o .ods");
        return;
      }
      const transferencia = new DataTransfer();
      transferencia.items.add(archivo);
      input.files = transferencia.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

/** Marca los pasos completados (1 base, 2 calificaciones, 3 análisis). */
export function actualizarProgreso(dbListo, gradesListo, analizando = false) {
  document.querySelectorAll("#progreso-carga .paso-progreso").forEach((el) => {
    const paso = Number(el.dataset.paso);
    const completo = paso === 1 ? dbListo : paso === 2 ? gradesListo : false;
    el.classList.toggle("completo", completo);
    el.classList.toggle("activo", paso === 3 && analizando);
  });
  const lineas = document.querySelectorAll("#progreso-carga .paso-linea");
  if (lineas[0]) lineas[0].classList.toggle("completo", dbListo);
  if (lineas[1]) lineas[1].classList.toggle("completo", dbListo && gradesListo);
}

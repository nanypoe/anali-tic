// js/app.js
import { leerArchivo } from './core/fileParser.js';
import { detectarConfiguracionAula } from './core/aulaMatcher.js';
import { cargarDiccionarios } from './core/diccionarios.js';
import { iniciarSesion, getTipoBase } from './core/store.js';
import { inicializarControlesTabla } from './ui/tableRenderer.js';
import { descargarPlantillaTic, descargarPlantillaVirtual } from './ui/plantillaRenderer.js';

document.addEventListener('DOMContentLoaded', () => {
  const dbFileInput = document.getElementById('db-file-input');
  const gradesFileInput = document.getElementById('grades-file-input');
  const uploadContainer = document.getElementById('upload-container');
  const statusArea = document.getElementById('status-area');
  const loaderOverlay = document.getElementById('loader-overlay');
  const navActions = document.getElementById('nav-actions');
  const badgeTipoBase = document.getElementById('badge-tipo-base');
  const infoSesion = document.getElementById('info-sesion');

  document.getElementById('btn-plantilla-tic')?.addEventListener('click', descargarPlantillaTic);
  document.getElementById('btn-plantilla-virtual')?.addEventListener('click', descargarPlantillaVirtual);


  async function verificarYEjecutarAnalisis() {
    if (dbFileInput.files.length > 0 && gradesFileInput.files.length > 0) {
      if (loaderOverlay) loaderOverlay.style.display = 'flex';

      setTimeout(async () => {
        try {
          await cargarDiccionarios();
          const dbFile = dbFileInput.files[0];
          const dbResult = await leerArchivo(dbFile);
          const gradesResult = await leerArchivo(gradesFileInput.files[0]);

          const configAula = await detectarConfiguracionAula(gradesResult.columnas);
          const { estudiantes, cambiosRestaurados } = iniciarSesion({
            nombreArchivo: dbFile.name,
            dbData: dbResult.data,
            dbColumnas: dbResult.columnas,
            gradesData: gradesResult.data,
            configAula,
          });

          if (uploadContainer) uploadContainer.classList.add('d-none');
          if (navActions) navActions.classList.remove('d-none');
          if (statusArea) statusArea.classList.remove('d-none');

          if (badgeTipoBase) {
            const esTic = getTipoBase() === 'tic';
            badgeTipoBase.textContent = esTic ? 'Base TIC completa' : 'Base básica (Virtual)';
            badgeTipoBase.className = `badge rounded-pill ${esTic ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}`;
          }
          if (infoSesion && cambiosRestaurados > 0) {
            infoSesion.textContent = `Se restauraron ${cambiosRestaurados} cambio(s) guardados en este navegador.`;
          }

          inicializarControlesTabla(estudiantes, configAula);
        } catch (error) {
          alert(`Error en el análisis: ${error.message}`);
        } finally {
          if (loaderOverlay) loaderOverlay.style.display = 'none';
        }
      }, 500);
    }
  }

  function marcarArchivoCargado(input, indicador) {
    const tarjeta = input.closest('.upload-card');
    const nombre = input.files[0]?.name;
    if (indicador) indicador.textContent = nombre ? nombre : '';
    if (tarjeta) tarjeta.classList.toggle('archivo-listo', Boolean(nombre));
  }
  dbFileInput.addEventListener('change', () => {
    marcarArchivoCargado(dbFileInput, document.getElementById('nombre-db'));
    verificarYEjecutarAnalisis();
  });
  gradesFileInput.addEventListener('change', () => {
    marcarArchivoCargado(gradesFileInput, document.getElementById('nombre-grades'));
    verificarYEjecutarAnalisis();
  });
});

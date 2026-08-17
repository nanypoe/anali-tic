// js/app.js
import { leerArchivo } from './core/fileParser.js';
import { detectarConfiguracionAula } from './core/aulaMatcher.js';
import { analizarEstudiantes } from './core/analyzer.js';
import { inicializarControlesTabla } from './ui/tableRenderer.js';

document.addEventListener('DOMContentLoaded', () => {
  const dbFileInput = document.getElementById('db-file-input');
  const gradesFileInput = document.getElementById('grades-file-input');
  const uploadContainer = document.getElementById('upload-container');
  const statusArea = document.getElementById('status-area');
  const loaderOverlay = document.getElementById('loader-overlay');
  const navActions = document.getElementById('nav-actions');

  async function verificarYEjecutarAnalisis() {
    if (dbFileInput.files.length > 0 && gradesFileInput.files.length > 0) {
      if (loaderOverlay) loaderOverlay.style.display = 'flex';

      setTimeout(async () => {
        try {
          const dbResult = await leerArchivo(dbFileInput.files[0]);
          const gradesResult = await leerArchivo(gradesFileInput.files[0]);

          const configAula = await detectarConfiguracionAula(gradesResult.columnas);
          const estudiantesAnalizados = analizarEstudiantes(dbResult.data, gradesResult.data, configAula);

          if (uploadContainer) uploadContainer.classList.add('d-none');
          if (navActions) navActions.classList.remove('d-none');
          if (statusArea) statusArea.classList.remove('d-none');

          inicializarControlesTabla(estudiantesAnalizados, configAula);

        } catch (error) {
          alert(`Error en el análisis: ${error.message}`);
        } finally {
          if (loaderOverlay) loaderOverlay.style.display = 'none';
        }
      }, 500);
    }
  }

  dbFileInput.addEventListener('change', verificarYEjecutarAnalisis);
  gradesFileInput.addEventListener('change', verificarYEjecutarAnalisis);
});
// js/app.js
import { leerArchivo } from './core/fileParser.js';
import { detectarConfiguracionAula } from './core/aulaMatcher.js';
import { cargarDiccionarios } from './core/diccionarios.js';
import { iniciarSesion, getTipoBase } from './core/store.js';
import { inicializarControlesTabla } from './ui/tableRenderer.js';
import { descargarPlantillaTic, descargarPlantillaVirtual } from './ui/plantillaRenderer.js';
import { mostrarIntroPrimeraVez } from './ui/intro.js';
import { activarArrastreArchivos, actualizarProgreso } from './ui/dropzone.js';
import { toast } from './ui/feedback.js';
import { inicializarNotificaciones } from './ui/notificationRenderer.js';

document.addEventListener('DOMContentLoaded', () => {
  const dbFileInput = document.getElementById('db-file-input');
  const gradesFileInput = document.getElementById('grades-file-input');
  const uploadContainer = document.getElementById('upload-container');
  const statusArea = document.getElementById('status-area');
  const loaderOverlay = document.getElementById('loader-overlay');
  const navActions = document.getElementById('nav-actions');
  const badgeTipoBase = document.getElementById('badge-tipo-base');
  const infoSesion = document.getElementById('info-sesion');

  mostrarIntroPrimeraVez();

  document.getElementById('btn-plantilla-tic')?.addEventListener('click', descargarPlantillaTic);
  document.getElementById('btn-plantilla-virtual')?.addEventListener('click', descargarPlantillaVirtual);

  function marcarArchivoCargado(input, indicador) {
    const tarjeta = input.closest('.upload-card');
    const nombre = input.files[0]?.name;
    if (indicador) indicador.textContent = nombre || '';
    if (tarjeta) tarjeta.classList.toggle('archivo-listo', Boolean(nombre));
    actualizarProgreso(dbFileInput.files.length > 0, gradesFileInput.files.length > 0);
  }

  async function verificarYEjecutarAnalisis() {
    if (dbFileInput.files.length === 0 || gradesFileInput.files.length === 0) return;

    actualizarProgreso(true, true, true);
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
        inicializarNotificaciones(estudiantes, getTipoBase());
        toast(`Análisis listo: ${estudiantes.length} estudiante(s)`, 'exito');
      } catch (error) {
        toast(`Error en el análisis: ${error.message}`, 'error');
        actualizarProgreso(true, true, false);
      } finally {
        if (loaderOverlay) loaderOverlay.style.display = 'none';
      }
    }, 500);
  }

  dbFileInput.addEventListener('change', () => {
    marcarArchivoCargado(dbFileInput, document.getElementById('nombre-db'));
    verificarYEjecutarAnalisis();
  });
  gradesFileInput.addEventListener('change', () => {
    marcarArchivoCargado(gradesFileInput, document.getElementById('nombre-grades'));
    verificarYEjecutarAnalisis();
  });

  activarArrastreArchivos([dbFileInput, gradesFileInput], (_, mensaje) => toast(mensaje, 'aviso'));
  actualizarProgreso(false, false);
});

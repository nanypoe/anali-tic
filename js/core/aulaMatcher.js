export async function detectarConfiguracionAula(columnasCalificaciones) {
  const archivosAulas = ['2026_MT_IS.json', '2026_MT_IIS.json', '2026_IHS_IS.json'];
  
  let mejorConfig = null;
  let maxCoincidencias = 0;

  for (const archivo of archivosAulas) {
    const res = await fetch(`./config/aulas/${archivo}`);
    const config = await res.json();
    
    // Extraer todos los cuestionarios definidos en este JSON
    const cuestionariosDefinidos = [];
    Object.values(config.modulos).forEach(unidades => {
      Object.values(unidades).forEach(cuestionarios => {
        cuestionariosDefinidos.push(...cuestionarios);
      });
    });

    // Contar cuántos cuestionarios de este JSON realmente están en el Excel
    const coincidencias = cuestionariosDefinidos.filter(c => 
      columnasCalificaciones.includes(c)
    ).length;

    // Evaluamos si este JSON es el que mejor se ajusta
    // 1. Si tiene más coincidencias que el anterior.
    // 2. O si tienen la misma cantidad de coincidencias, preferimos el que tenga
    //    MENOS cuestionarios sobrantes (coincidencia exacta de tamaño).
    if (coincidencias > maxCoincidencias) {
      maxCoincidencias = coincidencias;
      mejorConfig = config;
    } else if (coincidencias > 0 && coincidencias === maxCoincidencias) {
      // Desempate: si ambos coinciden en N ítems, elegimos el JSON más específico (el de menor tamaño)
      const totalDefinidosActual = cuestionariosDefinidos.length;
      const totalDefinidosMejor = contarCuestionarios(mejorConfig);
      
      if (totalDefinidosActual < totalDefinidosMejor) {
        mejorConfig = config;
      }
    }
  }

  if (mejorConfig && maxCoincidencias > 0) {
    return mejorConfig;
  }
  
  throw new Error("No se encontró una estructura de aula compatible para este archivo.");
}

// Función auxiliar para contar total de cuestionarios en una config
function contarCuestionarios(config) {
  let total = 0;
  if (!config) return Infinity;
  Object.values(config.modulos).forEach(unidades => {
    Object.values(unidades).forEach(cuestionarios => {
      total += cuestionarios.length;
    });
  });
  return total;
}
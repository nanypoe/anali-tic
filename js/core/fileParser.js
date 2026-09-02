// js/core/fileParser.js

/**
 * Lee un archivo .xlsx o .ods usando SheetJS y extrae sus datos en JSON y la lista de columnas.
 * @param {File} file - Archivo capturado desde el input
 * @returns {Promise<{ data: Array<Object>, columnas: Array<string> }>}
 */
// js/core/fileParser.js
export function leerArchivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir contenido a JSON asegurando strings limpios
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

        // Extraer encabezados de la primera fila
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const columnas = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          if (cell && cell.v !== undefined && cell.v !== null) {
            columnas.push(String(cell.v).trim());
          }
        }

        resolve({ data: jsonData, columnas });
      } catch (error) {
        reject(new Error(`Error al leer "${file.name}": ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error(`No se pudo cargar el archivo ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}
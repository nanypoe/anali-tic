const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const statusArea = document.getElementById('status-area');
const statusMessage = document.getElementById('status-message');

// 1. Manejar eventos de arrastrar y soltar
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drop-active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drop-active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drop-active');
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

// 2. Función principal para procesar el archivo
function handleFile(file) {
    if (!file) return;

    statusArea.classList.remove('d-none');
    statusMessage.innerText = "Leyendo archivo: " + file.name;

    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        // Usamos la librería XLSX para leer el ODS
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Tomamos la primera hoja del archivo
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertimos el contenido a un arreglo de objetos JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log("Datos procesados correctamente:", jsonData);
        
        statusMessage.className = "alert alert-success";
        statusMessage.innerText = `¡Éxito! Se han cargado ${jsonData.length} filas. Revisa la consola (F12) para ver los datos.`;
        
        // Guardamos los datos globalmente para la Fase 2
        window.estudiantesData = jsonData;
    };

    reader.readAsArrayBuffer(file);
}
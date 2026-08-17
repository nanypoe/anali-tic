# Anali-TIC v2.0

**Analizador Inteligente de Calificaciones para Aulas Virtuales**

Una aplicación web moderna para analizar y visualizar el desempeño académico de estudiantes en diferentes aulas virtuales. Permite importar datos de bases de datos y calificaciones en formatos Excel/ODS, con detección automática de configuraciones de aula y generación de reportes interactivos.

---

## 🎯 Características Principales

- **📊 Análisis Inteligente de Datos**: Procesa archivos Excel/ODS (.xlsx, .ods) con datos de estudiantes y calificaciones
- **🔍 Detección Automática de Aulas**: Identifica automáticamente la configuración del aula basándose en los datos importados
- **📈 Visualización Interactiva**: Genera tablas dinámicas con filtros y búsqueda en tiempo real
- **📱 Interfaz Responsive**: Diseño moderno y adaptable a dispositivos móviles
- **🎓 Soporte Multi-Aula**: Compatible con múltiples configuraciones de aulas (IHS, MT-IS, MT-IIS, etc.)
- **📋 Reportes Flexibles**: Modo reporte que oculta/muestra calificaciones según necesidad
- **👥 Análisis por Grupos**: Filtrado dinámico por grupo, módulo y estado de completitud
- **📸 Captura de Pantalla**: Exportar análisis como imágenes (html2canvas)
- **💬 Integración WhatsApp**: Generador de listas formateadas para compartir en WhatsApp

---

## 📁 Estructura del Proyecto

```
anali-tic/
├── index.html              # Punto de entrada principal (v2.0)
├── config/                 # Configuraciones de aulas
│   └── aulas/
│       ├── 2026_IHS_IS.json       # Identidad Histórica y Sociocultural
│       ├── 2026_MT_IIS.json       # Módulo II de Ingeniería de Sistemas
│       └── 2026_MT_IS.json        # Módulo de Informática Superior
├── css/
│   └── styles.css          # Estilos personalizados de la aplicación
├── js/
│   ├── app.js              # Orquestador principal - flujo de la aplicación
│   ├── core/               # Lógica central y procesamiento de datos
│   │   ├── fileParser.js       # Lectura y parseo de archivos Excel/ODS
│   │   ├── aulaMatcher.js      # Detección inteligente de aulas
│   │   └── analyzer.js         # Análisis y procesamiento de datos
│   └── ui/                 # Componentes de interfaz de usuario
│       ├── tableRenderer.js    # Renderizado de tablas y filtros
│       ├── chartRenderer.js    # Generación de gráficos y visualizaciones
│       └── modalRenderer.js    # Componentes de modales y diálogos
└── README.md               # Este archivo
```

---

## 🚀 Inicio Rápido

### Requisitos

- Navegador moderno con soporte ES6 (Chrome, Firefox, Safari, Edge)
- Archivos de datos en formato Excel (.xlsx) u ODS (.ods)

### Instalación

1. **Clonar o descargar el repositorio**
   ```bash
   git clone https://github.com/nanypoe/anali-tic.git
   cd anali-tic
   ```

2. **Abrir en navegador**
   - Opción 1: Abrir directamente `index.html` en el navegador
   - Opción 2: Usar un servidor local (recomendado):
     ```bash
     # Con Python 3
     python -m http.server 8000
     # Con Node.js (http-server)
     npx http-server
     ```
   - Luego acceder a `http://localhost:8000`

### Uso Básico

1. **Cargar Archivos**:
   - Hacer clic en "Cargar Base de Datos" y seleccionar archivo con datos de estudiantes
   - Hacer clic en "Cargar Calificaciones" y seleccionar archivo con calificaciones

2. **Procesamiento Automático**:
   - La aplicación detecta automáticamente la configuración de aula
   - Procesa y analiza los datos
   - Genera la interfaz de análisis

3. **Explorar Datos**:
   - Seleccionar módulos usando las píldoras en la parte superior
   - Filtrar por grupo usando el selector desplegable
   - Usar píldoras de estado (Todos, Completados, Pendientes, etc.)
   - Buscar estudiantes por nombre

4. **Generar Reportes**:
   - Usar botón "Ocultar/Mostrar Calificaciones" para modo reporte
   - Exportar como imagen con captura de pantalla
   - Generar listas para WhatsApp

---

## ⚙️ Configuración de Aulas

Las configuraciones de aula se definen en archivos JSON bajo `config/aulas/`. Cada archivo especifica:

- **id**: Identificador único de la aula
- **nombre**: Nombre descriptivo del módulo/aula
- **convalidaciones_map**: Mapeo de nombres de módulos para detectar variantes
- **modulos**: Estructura de módulos con unidades y cuestionarios

### Ejemplo de Configuración

```json
{
  "id": "26_ihs_1semestre",
  "nombre": "Identidad Histórica y Sociocultural de Nicaragua",
  "convalidaciones_map": {
    "Identidad Histórica y Sociocultural de Nicaragua": "conv_IHS"
  },
  "modulos": {
    "Identidad Histórica y Sociocultural de Nicaragua": {
      "Unidad 1": [
        "Cuestionario:Act1.2-Cuest-Saberes ancestrales..."
      ],
      "Unidad 2": [
        "Cuestionario:Act.2.2-Cuest-Espíritu de resistencia..."
      ]
    }
  }
}
```

### Crear Nueva Configuración de Aula

1. Crear archivo JSON en `config/aulas/` siguiendo el formato anterior
2. Actualizar lista de archivos en `js/core/aulaMatcher.js`
3. Recargar la aplicación

---

## 🔧 Arquitectura Técnica

### Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+ (Módulos)
- **CSS Framework**: Bootstrap 5.3
- **Librerías**:
  - **SheetJS (XLSX)**: Lectura de archivos Excel/ODS
  - **html2canvas**: Captura de pantalla
  - **Bootstrap Icons**: Iconografía

### Flujo de la Aplicación

```
┌─────────────────┐
│  Cargar Archivos│
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  fileParser.js       │  ← Leer Excel/ODS
│  Extraer datos       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ aulaMatcher.js       │  ← Detectar configuración
│ Seleccionar config   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  analyzer.js         │  ← Procesar y analizar
│  Calcular métricas   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  tableRenderer.js    │  ← Renderizar UI
│  chartRenderer.js    │
│  modalRenderer.js    │
└──────────────────────┘
```

---

## 📦 Módulos y Componentes

### `js/core/fileParser.js`
**Responsabilidad**: Lectura y parseo de archivos

- `leerArchivo(file)`: Lee archivos .xlsx/.ods y extrae datos en JSON
- Extrae automáticamente nombres de columnas
- Manejo de errores con mensajes descriptivos
- Soporta múltiples formatos de hoja de cálculo

### `js/core/aulaMatcher.js`
**Responsabilidad**: Detección inteligente de aula

- `detectarConfiguracionAula(columnasCalificaciones)`: Identifica qué configuración JSON se ajusta mejor
- Algoritmo de matching por coincidencias de cuestionarios
- Desempate automático eligiendo configuración más específica
- Carga dinámica de archivos JSON de configuración

### `js/core/analyzer.js`
**Responsabilidad**: Análisis y procesamiento de datos

- `analizarEstudiantes(dbData, gradesData, config)`: Procesa y analiza datos
- `obtenerValorCampo()`: Búsqueda flexible de campos (insensible a mayúsculas, tildes)
- `deducirTurno()`: Detecta turno académico (Diurno, Nocturno, Sabatino, etc.)
- Genera objetos de estudiantes enriquecidos con métricas
- Calcula porcentajes de completitud por unidad/módulo

### `js/ui/tableRenderer.js`
**Responsabilidad**: Renderizado dinámico de tablas

- `inicializarControlesTabla()`: Configura todos los filtros y búsqueda
- `renderizarPildorasModulos()`: Genera píldoras de módulos clicables
- `popularSelectorGrupos()`: Llena selector dinámicamente
- `configurarFiltrosEstado()`: Configura filtros de completitud
- Actualización en tiempo real de tabla según filtros
- Integración con modalRenderer para acciones

### `js/ui/chartRenderer.js`
**Responsabilidad**: Generación de gráficos y visualizaciones

- Renderizado de gráficos de progreso
- Estadísticas visuales por grupo/módulo/unidad
- Integración con librerías de gráficos

### `js/ui/modalRenderer.js`
**Responsabilidad**: Componentes modales y diálogos

- `mostrarModalBoletaIndividual()`: Boleta individual de estudiante
- `copiarListaWhatsAppGrupal()`: Genera lista formateada para WhatsApp
- `mostrarModalCredenciales()`: Muestra credenciales de acceso
- Diálogos interactivos reutilizables

---

## 📊 Formatos de Datos Esperados

### Archivo de Base de Datos
Debe contener al menos:
- Nombres/Identificadores de estudiantes
- Grupo/Turno
- Carrera/Programa

### Archivo de Calificaciones
Debe contener:
- Identificador de estudiante (para matching)
- Columnas de cuestionarios/actividades (nombres deben coincidir con config)
- Calificaciones o estado de completitud

---

## 🎨 Personalización

### Modificar Estilos
Editar `css/styles.css` para cambiar colores, tamaños y estilos.

### Agregar Nueva Aula
1. Crear `config/aulas/2026_[CODIGO].json`
2. Definir estructura de módulos y cuestionarios
3. Agregar archivo a lista en `aulaMatcher.js`

### Extender Funcionalidades
- Agregar nuevos renderers en `js/ui/`
- Extender lógica de análisis en `js/core/analyzer.js`
- Crear nuevos componentes siguiendo patrón de módulos ES6

---

## 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| No detecta aula correctamente | Verificar que nombres de columnas en Excel coincidan con configuración |
| Archivo no carga | Usar formato .xlsx o .ods; verificar estructura del archivo |
| Errores en consola | Abrir DevTools (F12) y revisar mensajes de error detallados |
| Tabla vacía | Verificar que archivos tengan datos y estructura válida |

---

## 📝 Notas de Desarrollo

- El proyecto usa **módulos ES6** para mejor organización y reutilización
- **Sin dependencias de npm**: Todas las librerías se cargan desde CDN
- **Arquitectura modular**: Fácil de mantener, testear y extender
- **Manejo de errores**: Mensajes descriptivos en toda la aplicación
- **Performance**: Procesamiento asincrónico para archivos grandes

---

## 🤝 Contribuciones

Para contribuir al proyecto:

1. Fork del repositorio
2. Crear rama para feature: `git checkout -b feature/nueva-feature`
3. Commit cambios: `git commit -m "Añadir nueva feature"`
4. Push a rama: `git push origin feature/nueva-feature`
5. Abrir Pull Request

---

## 📄 Licencia

Proyecto desarrollado para fines educativos.

---

## 👤 Autor

**nanypoe** - [GitHub Profile](https://github.com/nanypoe)

---

## 📞 Soporte

Para reportar bugs o solicitar features, abrir un issue en el repositorio.

---

## 📅 Changelog

### v2.0 (Actual)
- ✅ Refactorización completa con arquitectura modular
- ✅ Separación de componentes de UI
- ✅ Detección inteligente de aulas
- ✅ Interfaz modernizada con Bootstrap 5
- ✅ Sistema de configuración dinámico
- ✅ Análisis flexible de datos

### v1.0
- 🔹 Versión inicial monolítica

---

**Última actualización**: 2026-08-17

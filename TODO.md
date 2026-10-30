# TODO - Mejoras de Anali-TIC

Lista viva de mejoras de intuitividad, retroalimentación visual, iconografía e imágenes.

## Completado: animaciones y retroalimentación

- [x] Opción visible "Reducir animaciones" en la cabecera. Se respeta la preferencia del sistema y se puede guardar una preferencia propia si el usuario lo desea en cualquier momento. Por defecto debe de permitir que todas las animaciones estén disponibles. Si el usuario las reduce, pues pasa al otro estado.


## Ideas para evaluar

- [x] Modo oscuro con la paleta de marca. Se puede cambiar con un botón de Claro a Oscuro. Por defecto estará el claro.
- [x] Atajos de teclado para filtros y para exportar (por ejemplo `E` para exportar pendientes). Atajos que no entren en contraposición de cualquier atajo en cualquier sistema y que sean intuitivos y que de alguna forma estén presentes de que existen, es decir: si yo paso el puntero por encima de un botón, me diga si tiene atajo o no. Por otro lado, hay que revisar bien la lógica de cada cosa, para primeramente determinar si es necesario un atajo y segundo, qué hará el atajo en sí.
- [x] Deshacer (toast con botón "Deshacer") para cambios manuales de estado o de módulo optativo o donde se haga necesario.

## Formato de exportación

- [x] Formatear la manera en que las plantillas de base de datos se ven, a continuación voy a explicar la forma en que tengo la plantilla de base TIC, que también podría ser utilizada a la base virtual:
    - La fila 1 contiene las siguientes columnas: Centro (o centro, ancho: 72px), Turno (ancho: 81px), Carrera (ancho: 108px), Grupos (ancho: 39px, orientación: 90 grados), Código (ancho: 145px), Protagonista (421px), Correo electrónico(424px), Usuario(222px), Teléfono(115px), Estado(102px), conv_HIN, conv_ACC, conv_OL, conv_IC, conv_CP, conv_IHS; los conv_[siglas del módulo] cada uno tiene 35px de ancho, orientación 90 grados. Por otro lado esta primera fila tiene filtro automático, para poder filtrarlos. Están en negrita. Arial 12
    - El resto de filas están en texto sin negrita, Arial 12.
    - Podríamos agregarle intuitividad con colores o un estilo de formato más acorde, pero eso lo decides a partir de lo que tenía yo como plantilla manual.
    - Una para la base TIC, otra para la Base Virtual.
    

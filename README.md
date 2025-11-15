Cocktail Bar Manager (Administrador de Bar de Cócteles)

Este proyecto es una aplicación standalone de Angular diseñada para demostrar una arquitectura de componentes robusta, la gestión de estado reactivo utilizando Signals (Señales) y el uso de theming personalizado con Angular Material.

Toda la aplicación —incluyendo todos los componentes, estilos y lógica— está contenida intencionalmente dentro de un único archivo app.component.ts para facilitar su portabilidad y simplicidad, adhiriéndose a las estrictas restricciones del entorno.

Características Principales

La aplicación simula una interfaz simple de gestión de cócteles, destacando las siguientes capacidades:

Estado Reactivo: Utiliza las Señales (Signals) de Angular (signal(), computed()) para la gestión del estado local (por ejemplo, el estado de carga, el filtrado de favoritos, el cálculo de la lista a mostrar).

Theming Personalizado de Material: Presenta un tema de Angular Material profundamente personalizado:

Paleta Primaria (Azul Personalizado): Una paleta azul única definida manualmente.

Paletas Accent y Warn: Utiliza las paletas predefinidas de Material (Rosa y Rojo) para la consistencia visual.

Compatibilidad M2: Emplea las funciones de Sass con prefijo m2- (ej., mat.m2-define-palette) para asegurar la compatibilidad con las versiones modernas de Angular Material.

Filtrado Dinámico: Incluye un botón de alternancia en la barra de herramientas para cambiar entre ver todos los cócteles y solo los favoritos definidos por el usuario (datos simulados).

Simulación de Búsqueda: Proporciona un campo de entrada de búsqueda con lógica simulada para filtrar la lista de cócteles por nombre.

Detalles Técnicos: Theming de Sass Personalizado

El tema está configurado meticulosamente para evitar errores de compilación y asegurar la coherencia del diseño entre los componentes de Material y el CSS global.

Definición del Tema

src/utils/scss/theme.scss

Define paletas ($my-primary-palette), el mapa del tema ($my-theme) y exporta variables CSS globales (--c-primary, etc.) para uso en CSS estándar o Tailwind. Importante: NO contiene mixins @include.

Inclusión del Tema y Globales

src/styles.scss

Actúa como el punto de entrada. Importa theme.scss y luego ejecuta los mixins de Sass de Angular Material necesarios (@include mat.core(), @include mat.all-component-themes(...)).

Corrección de la Configuración de Tipografía

Para resolver el error del compilador relacionado con que la pila de fuentes no era un valor CSS válido, la pila de fuentes se define como una variable de cadena de Sass entre comillas:

$app-font-stack: 'Roboto, "Helvetica Neue", Arial, sans-serif';
// ... se usa dentro de mat.define-typography-config((font-family: $app-font-stack))

Esta variable se utiliza luego de forma consistente tanto para los tokens del tema Material como para el estilo global body { font-family: theme.$app-font-stack; }.

Comandos de Desarrollo Estándar

Este proyecto fue generado usando Angular CLI versión 19.2.15.

Servidor de Desarrollo

Para iniciar un servidor de desarrollo local, ejecute:

ng serve

Una vez que el servidor esté funcionando, abre tu navegador y navega a http://localhost:4200/. La aplicación se recargará automáticamente cada vez que modifiques cualquier archivo fuente.

Compilación (Building)

Para compilar el proyecto, ejecuta:

ng build

Esto compilará tu proyecto y almacenará los artefactos de compilación en el directorio dist/. Por defecto, la compilación de producción optimiza tu aplicación para el rendimiento y la velocidad.

Ejecución de Pruebas Unitarias

Para ejecutar pruebas unitarias con el test runner Karma, usa el siguiente comando:

ng test

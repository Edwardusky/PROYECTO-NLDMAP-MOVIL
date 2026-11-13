
Aplicación móvil para gestión de reportes de personas no localizadas y desaparecidas – NLDMAP Móvil

## 1. Naturaleza del proyecto

NLDMAP Móvil es una aplicación multiplataforma desarrollada con React Native y Expo, orientada a facilitar la consulta geográfica de reportes de personas no localizadas, así como la captura de información relacionada con su búsqueda y seguimiento.

La aplicación constituye el componente móvil del ecosistema NLDMAP y está diseñada bajo una a *Arquitectura modular basada en funcionalidades*, que favorece la separación de responsabilidades, la reutilización de componentes y el mantenimiento progresivo del código.

Actualmente se encuentra en una etapa de desarrollo y prototipado funcional. Integra interfaces interactivas, validaciones locales y datos ficticios utilizados exclusivamente para demostración y pruebas.

## 2. Objetivo

Desarrollar una aplicación móvil que permita consultar información georreferenciada sobre personas no localizadas y proporcione herramientas para registrar reportes, consultar su seguimiento y realizar aportaciones relacionadas con posibles avistamientos.

El proyecto busca ofrecer una interfaz accesible, intuitiva y adaptable a dispositivos móviles, facilitando la interacción de los usuarios con información geográfica y formularios estructurados.

Asimismo, contempla su integración futura con los servicios de NLDMAP Backend mediante una API desarrollada en ASP.NET Core, manteniendo la independencia entre la presentación móvil y los mecanismos de procesamiento y persistencia de datos.

## 3. Funcionalidades principales

### Consulta de reportes en el mapa

- Visualización de un mapa interactivo.
- Exploración geográfica con desplazamiento y acercamiento.
- Representación de reportes mediante marcadores.
- Filtrado de reportes de acuerdo con su estado de seguimiento.
- Identificación de diferentes reportes que comparten una ubicación.
- Consulta de información descriptiva de casos ficticios.

### Creación de reportes

- Formulario organizado en cinco etapas.
- Captura de datos de identificación de la persona reportada.
- Registro de características físicas y señas particulares.
- Incorporación de fotografías desde la galería del dispositivo.
- Registro de circunstancias, fechas y lugares relacionados con los hechos.
- Selección y confirmación de coordenadas geográficas.
- Captura de información de contacto de quien reporta.

### Registro e inicio de sesión

- Interfaces para registro de cuentas e inicio de sesión.
- Validaciones  de campos.
- Campos de contraseña con opción para mostrar u ocultar su contenido.
- Navegación entre formularios de acceso y registro.

### Perfil del usuario

- Visualización y edición temporal de información personal.
- Administración local de datos de contacto.
- Reutilización de información del perfil durante la elaboración de reportes.

### Geolocalización

- Obtención de la ubicación del dispositivo mediante permisos explícitos.
- Centrado del mapa en la posición proporcionada por el sistema.
- Selección manual de coordenadas.
- Confirmación de la ubicación asociada a un borrador.


## 4. Características técnicas

NLDMAP Móvil incorpora las siguientes características:

- **Desarrollo multiplataforma:** base de código compartida con React Native y Expo para Android e iOS, con componentes específicos cuando la plataforma lo requiere.
- **Arquitectura modular:** organización por funcionalidades mediante módulos de mapa, autenticación, perfil y reportes.
- **Navegación basada en archivos:** implementación de rutas y navegación mediante Expo Router.
- **Tipado estático:** utilización de TypeScript para definir estructuras de datos, componentes y contratos internos.
- **Cartografía interactiva:** integración de MapLibre React Native para visualizar información geográfica.
- **Componentes reutilizables:** controles de formulario, elementos visuales y utilidades compartidas.
- **Administración de estado:** uso de React Context y hooks para coordinar información temporal entre pantallas.
- **Validaciones locales:** comprobación de campos, fechas, coordenadas y datos de contacto.
- **Compatibilidad con funcionalidades nativas:** acceso a geolocalización y selección de imágenes mediante módulos Expo.
- **Pruebas automatizadas:** verificaciones de validación, manejo de coordenadas y algunas reglas de interacción.
- **Desarrollo desacoplado de Docker:** ejecución local mediante Node.js, Metro y herramientas de compilación nativas.

### Arquitectura del proyecto

El código fuente adopta una arquitectura basada en funcionalidades (*Feature-Based Architecture*), organizada principalmente en:

```text
app/
└── src/
    ├── app/          # Rutas y navegación
    ├── features/     # Módulos funcionales
    │   ├── auth/     # Registro y acceso
    │   ├── map/      # Cartografía y ubicación
    │   ├── profile/  # Perfil del usuario
    │   └── reports/  # Reportes y borradores
    └── shared/       # Componentes y utilidades comunes
```

Esta organización permite que cada módulo concentre sus componentes, modelos, estado y lógica específica, evitando que las pantallas dependan directamente de los detalles de implementación de otras funcionalidades.



## 5. Stack tecnológico de desarrollo

| Tecnología | Versión declarada | Función |
|---|---|---|
| React Native | 0.86.3 | Desarrollo de interfaces móviles |
| React | 19.2.3 | Componentes y gestión de interfaces |
| Expo SDK | 57 | Plataforma y herramientas de desarrollo |
| Expo Router | ~57.0.24 | Navegación basada en archivos |
| TypeScript | ~6.0.3 | Tipado y desarrollo |
| MapLibre React Native | ^11.4.0 | Mapas interactivos |
| Expo Location | ~57.0.20 | Geolocalización |
| Expo Image Picker | ~57.0.20 | Selección de imágenes |
| Expo Dev Client | ~57.0.19 | Compilaciones de desarrollo |

Las versiones corresponden a las dependencias declaradas en `app/package.json`.

### Herramientas de desarrollo

- **Node.js y npm:** ejecución del entorno JavaScript y administración de dependencias.
- **Visual Studio Code:** edición y mantenimiento del código fuente.
- **Metro Bundler:** servidor de desarrollo y actualización del código JavaScript.
- **Android Studio y Android SDK:** compilación y ejecución local en Android.
- **Xcode:** compilación y simulación para iOS en macOS.
- **EAS Build:** generación alternativa de compilaciones mediante los servicios de Expo.
- **Git y GitHub:** control de versiones y colaboración.

### Ejecución del proyecto

Desde la carpeta `app/`:

```bash
npm ci
```

Para iniciar el servidor de desarrollo:

```bash
npx expo start --dev-client
```

Para compilar e instalar una versión de desarrollo en Android:

```bash
npx expo run:android --device
```

Para compilar en el simulador iOS, utilizando macOS y Xcode:

```bash
npx expo run:ios
```

**Nota:** debido a la integración de MapLibre y otros módulos nativos, la aplicación requiere una *development build*. Expo Go no incluye todas las dependencias nativas necesarias.

## 6. Estado actual del desarrollo

La rama `feature/prototipo-interfaz-movil` contiene un prototipo funcional enfocado en la navegación, la consulta cartográfica y la captura local de información.

## 7. Evolución prevista

El desarrollo contempla la incorporación progresiva de autenticación, consumo de servicios HTTP, persistencia de información, consulta de reportes asociados a una cuenta y comunicación de posibles avistamientos.

Estas funcionalidades se integrarán manteniendo la separación entre las interfaces móviles, la lógica de cada módulo y los servicios de NLDMAP Backend.


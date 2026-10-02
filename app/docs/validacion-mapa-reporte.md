# Mapa, perfil local y reporte mínimo

## Alcance y referencia

Se leyó el texto de `BOLETIN MINIMO e INFORMACION BASICA RNPDO.docx` y se inspeccionaron sus dos imágenes incrustadas: zona corporal y referencia geográfica. La referencia procede del archivo aportado por el usuario; no se verificó como versión oficial vigente ni como prueba de cumplimiento legal. No se recibieron capturas adicionales de los cortes de NLDMAP.

El núcleo mínimo descrito en el boletín incluye identidad, descripción física, señas particulares, vestimenta, fotografía, fecha/hora/lugar, relato, posibles personas o vehículos involucrados y contacto de quien reporta. Su formulario institucional incluye además CURP, RFC, escolaridad y consentimientos propios. Estos últimos no se trasladan a NLDMAP.

No hay autenticación real, backend, registro oficial, envío, publicación, geocodificación ni almacenamiento persistente implementado. El estado de perfil y borrador vive en React y se pierde al reiniciar el proceso. El selector puede devolver archivos temporales administrados por el sistema/SDK; la app conserva únicamente la URI de vista previa en memoria y no la sube.

## Diagnóstico

- El proveedor de área segura ya estaba dentro del Modal y la altura porcentual se había sustituido por flex. No se reprodujo el corte en un teléfono. Por ello no se atribuye su causa a un inset concreto.
- El encabezado estaba dentro del ScrollView: desaparecía al desplazar contenido. Ahora el encabezado y el cierre son hermanos del área desplazable; el fondo del panel es un hijo del contenedor seguro transparente.
- El Modal aplica sus propios insets una sola vez a sus cuatro bordes. No se añaden medidas de barras ni initialWindowMetrics de otra ventana. El panel usa flex y minHeight: 0.
- El Switch de Relieve no tenía colores explícitos. La implementación nativa permite configurar trackColor, thumbColor e ios_backgroundColor. Se conserva el Switch nativo, apagado y deshabilitado, con pista oscura y botón claro. El círculo aislado no fue reproducido: la causa por color sigue siendo una hipótesis.
- No existen maxBounds geográficos configurados. Mi ubicación conserva esa ausencia de límites regionales y rechaza coordenadas polares fuera de la representación Mercator, sin ajustar límites silenciosamente.
- El mapa mantiene su proveedor, teselas, brújula y atribución. Las letras B, L y B/L diferencian los estados incluso sin color. Los casos coincidentes siguen siendo registros independientes en la misma coordenada, cada uno con su identificador.
- Mi ubicación está en la franja inferior desplazable, fuera del viewport del mapa. No cubre la brújula, atribución ni controles de filtros. Esta franja tiene una altura máxima proporcional para dejar espacio al mapa con texto aumentado.

## Decisiones de campos

| Entidad | Campo | Obligación en esta etapa | Justificación |
| --- | --- | --- | --- |
| Perfil | Nombre y apellidos | Opcionales | Explorar no requiere completar identidad ni simular cuenta |
| Perfil | Correo y teléfono | Opcionales; se valida formato si se escribe | Preparar contacto reutilizable |
| Perfil | Estado, municipio, localidad/colonia, CP, calle/número, referencias | Opcionales | No exigir domicilio completo |
| Perfil | Redes sociales y foto | Opcionales | Contacto adicional y vista previa local |
| Persona buscada | Nombre | Requerido al avanzar a descripción | Identificación mínima del borrador |
| Persona buscada | Apellidos | Opcionales | No bloquear por información incompleta |
| Persona buscada | Edad | Conocida/aproximada requiere 0–120 años; admite No se sabe | Declarar incertidumbre |
| Persona buscada | Sexo | Admite No se sabe | Evitar inferencias |
| Persona buscada | Foto | Opcional | Seleccionar, reemplazar o quitar; no publicar |
| Descripción | Estatura y unidad | Opcional; valor positivo de hasta 300 cm, unidad cm/m | Detectar errores de unidad sin exigir descripción |
| Descripción | Complexión, piel, cabello, ropa y calzado | Opcionales | Vacío significa no indicado |
| Descripción | Señas: tipo, zona/lado, descripción | Lista opcional | Registrar solo lo conocido sin diagrama obligatorio |
| Hechos | Fecha y hora | Conocida/aproximada requiere valor válido; ambas admiten No se sabe | No fabricar precisión |
| Hechos | Tipo de ubicación | Selección explícita, editable; inicial Última vez vista | Separar ubicación inferida y avistamiento |
| Hechos | Coordenada | Requerida para avanzar a contacto | Confirmación explícita en mapa; corrección cancelable |
| Hechos | Estado, municipio, localidad y referencia | Opcionales | Captura manual, sin geocodificación |
| Hechos | Relato | Requerido | Contexto mínimo; no clasifica delitos |
| Hechos | Vehículos/personas involucradas | Solo si aplica, descripción opcional | No inferir participación |
| Reportante | Nombre | Requerido para revisión | Contacto por reporte |
| Reportante | Correo o teléfono | Al menos uno válido | Medio de contacto utilizable |
| Reportante | Relación | Admite Prefiero no indicar | Atributo por reporte, no del perfil |
| Reportante | Domicilio y redes | Opcionales | Copia editable de perfil, privada |
| Revisión | Uso y publicación | Aviso informativo; no casillas institucionales | No se envía ni publica; publicación futura requeriría decisión aparte |

La obligación indicada es una decisión de producto para revisar un borrador; no es una afirmación de requisitos legales.

## Dependencias y configuración nativa

Se instalaron `expo-location ~57.0.20` y `expo-image-picker ~57.0.20` mediante Expo SDK 57. El image picker incorpora `expo-image-loader` como dependencia transitiva. npm actualizó también metadatos de dependencias pares del lockfile; no se solicitaron otras dependencias directas.

El APK anterior necesita una nueva development build si no incluye estos módulos. No se ejecutaron builds EAS ni prebuild. Solo se inspeccionó `expo config --type introspect`.

- Ubicación: permisos de primer plano, una consulta al pulsar, sin watchers ni seguimiento. Maneja solicitud en curso, denegación, denegación definitiva con Ajustes, servicios desactivados, posición aproximada, errores, timeout y resultados tardíos tras abandonar la pantalla.
- El margen de precisión es la incertidumbre que devuelve el sistema, no una garantía de exactitud. La posición no se mezcla con los casos de demostración ni confirma un punto del reporte.
- Galería: selector del sistema para imágenes, sin edición/cámara/vídeos ni solicitud general de acceso a la biblioteca. Cámara, micrófono y permisos Android de lectura/escritura general de almacenamiento están bloqueados. Cancelar conserva la foto anterior. Fallos muestran mensaje y los errores de permiso ofrecen Ajustes.
- El retorno desde la galería depende de la plataforma; si Android mata el proceso, el borrador en memoria se pierde, como el resto del estado local.

Referencias técnicas consultadas: [Expo Location SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/location/), [Expo ImagePicker SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/), [Safe area SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/). La llamada `CameraRef.flyTo({ center, zoom, duration })` se verificó en el código de MapLibre instalado (11.4.0).

## Comprobaciones automatizadas y revisión de código

- `npx tsc --noEmit`: correcto con npm/npx temporal, sin instalación global.
- `git diff --check`: correcto.
- `node --test tests/local-flows.test.cjs`: 15 pruebas correctas. Cubren borrador mínimo, errores, fechas reales, contactos, reutilización sin sobrescribir correcciones, coordenadas, estados independientes y coincidencias, consulta de ubicación concedida/denegada, servicios desactivados, posición aproximada, resultados tardíos, límites de representación y contraste.
- Lint: no hay configuración ni ESLint instalado. No se ejecuta ni se instala.
- Contraste calculado contra superficies normal/alternativa/blanca: texto principal mínimo 10.09:1, secundario 5.15:1, estados y errores mínimo 5.23:1, bordes mínimo 3.45:1; blanco sobre acción principal 11.90:1. Los bordes decorativos divisores no identifican acciones. El halo sobre teselas y la atenuación nativa de controles deshabilitados requieren observación en dispositivo.
- Revisión de acciones: botones con onPress o navegación Link; controles de icono con etiqueta específica; cierres de 48×48; filtros con estado accesible; Relieve intencionadamente deshabilitado. Los controles de texto obtienen también su nombre accesible del texto visible.
- El contacto local solo se consume en Perfil y el formulario privado. Las fichas públicas siguen leyendo exclusivamente DEMO_CASES.

## Pruebas manuales pendientes en development build

No se realizaron pruebas reales en teléfono ni emulador. Las pruebas automatizadas de ubicación usan un adaptador simulado; no acreditan permisos, sensores ni UI nativa.

| Escenario | Procedimiento y resultado esperado | Estado |
| --- | --- | --- |
| Permiso concedido | Pulsar Mi ubicación. Ver estado en curso y movimiento a posición real; no aparece solicitud al abrir la app | Pendiente en teléfono |
| Permiso denegado | Denegar. Ver mensaje; mapa sigue utilizable; repetir según política del sistema | Pendiente en teléfono |
| Permiso bloqueado | Denegar definitivamente. Abrir Ajustes desde aviso; conceder y volver a pulsar | Pendiente en teléfono |
| Servicios desactivados | Apagar ubicación del sistema. Ver aviso sin movimiento ficticio | Pendiente en teléfono |
| Posición aproximada | Conceder solo aproximada. Ver mensaje y margen; no se presenta como exacta | Pendiente en teléfono |
| Error/tiempo agotado | Sin señal: tras la espera ver error y poder reintentar. Salir durante consulta: no mover cámara después | Pendiente en teléfono |
| Selección y corrección | Confirmar punto, completar datos, corregir punto, cancelar: conservar punto anterior y campos. Repetir confirmando: actualizar solo coordenada | Pendiente en teléfono |
| Galería | Perfil y persona buscada: seleccionar, reemplazar, cancelar, quitar; cancelar no borra foto previa. Probar URI no disponible y permiso denegado si la plataforma lo solicita | Pendiente en teléfono |
| Formulario | Recorrer 5 pasos, retroceder con botón y Atrás Android, editar desde resumen. Conservar campos, foto y señas. Fecha imposible/correo incorrecto: error; desconocidos: permitir | Pendiente en teléfono |
| Acción final | Pulsar Enviar reporte con datos válidos: Función no disponible; no folio, éxito, envío ni publicación | Pendiente en teléfono |
| Login/registro | No hay botón Volver al mapa; Atrás conserva salida. Validaciones y acciones pendientes sin sesión falsa. Perfil accesible desde login | Pendiente en teléfono |
| Filtros | Alternar cada estado: 4, 2 o 0 casos según selección. Ambos apagados: mensaje vacío. Alfa/Delta comparten punto, detalle conserva su ID | Pendiente en teléfono |
| Paneles | Abrir Casos/Eventos/Capas: fondo completo entre áreas seguras; encabezado/cierre visibles al desplazar. Cerrar fuera, icono y Atrás Android | Pendiente en teléfono |
| Tamaño y accesibilidad | Pantalla pequeña, fuente al 200%, gestos y navegación de 3 botones, dispositivo con notch; TalkBack/VoiceOver y contraste de iconos sobre teselas claras/oscuras | Pendiente en teléfono |
| Horizontal | La app sigue configurada portrait. Probar el componente en un host de pruebas que permita horizontal; no cambiar silenciosamente la configuración del producto | Pendiente |
| Relieve | Ver pista y botón apagado, etiqueta No disponible y estado accesible deshabilitado en iOS/Android claros/oscuros | Pendiente en teléfono |

Desde `app`, iniciar Metro con `npx expo start --dev-client` y abrir una development build que incluya los dos módulos. No usar Expo Go para validar MapLibre. El mapa web es un fallback y no reproduce Modal/MapLibre nativos.

## Corrección del arranque cuando faltan módulos nativos

Los tres adjuntos de error repiten `Cannot find native module 'ExpoLocation'`. El mensaje pegado añade el mismo fallo para `ExponentImagePicker` y después `Cannot read property 'ErrorBoundary' of undefined`.

Los dos primeros son fallos del registro nativo de la app que está ejecutando JavaScript. Los paquetes JS sí se resolvieron: las trazas llegan a `requireNativeModule` dentro de cada paquete. Ocurren antes de solicitar permisos o leer sensores/galería. No son errores de tipos, permiso denegado, GPS, red ni resolución de paquetes de Metro.

La causa habitual es usar un APK anterior a la incorporación de esos módulos. No se inspeccionó el APK ni se confirmó su fecha: si ya fue reconstruido con ambos paquetes, habría que revisar el autolinking y que se abrió e instaló el binario correcto. Los módulos incluyen su configuración de autolinking y los plugins están declarados en app.json.

El error de Router es consistente con una consecuencia de las importaciones fallidas: `fromImport` desestructura `ErrorBoundary` de la exportación de una ruta que llega como undefined. Las rutas mantienen su exportación default. No se modificó Router, no se añadieron exportaciones ficticias y no se desactivaron validaciones. Si ese error reaparece después de reiniciar completamente con esta corrección, se necesita la nueva primera excepción de la sesión para comprobar una causa independiente.

Versiones comprobadas en este workspace: Expo 57.0.26, expo-location 57.0.20, expo-image-picker 57.0.20, expo-modules-core 57.0.20, Expo Router 57.0.24, React Native 0.86.3 y MapLibre 11.4.0. El catálogo del SDK instalado recomienda ~57.0.20 para ambos módulos. Esto verifica la instalación local; no identifica el contenido del APK ni acredita una instalación distinta en `/workspace/app`.

Corrección mínima: `src/utils/native-features.ts` consulta `requireOptionalNativeModule<unknown>` antes de evaluar cada paquete, y hace su importación dinámica únicamente al pulsar la acción. El hook de ubicación y el selector de fotos muestran un error específico de build cuando falta el módulo. No se sustituye una posición, imagen ni resultado por datos inventados. Con los módulos presentes se usan las mismas APIs y opciones existentes. Web conserva las implementaciones web sin consultar el registro Android/iOS.

Validación de esta corrección: 24 pruebas correctas en total, incluidas nueve regresiones de carga diferida y ausencia/presencia de módulos con registro simulado. TypeScript pasó mediante `npx --offline --call "node node_modules/typescript/bin/tsc --noEmit"`: el intento literal de `npx tsc --noEmit` se interrumpió porque esta instalación tiene el launcher `tsc` de Linux sin `tsc.cmd` en Windows. No se modificó node_modules. `git diff --check` correcto. Lint sigue sin configuración y no se instala.

Prueba pendiente en teléfono:

1. Detener/reiniciar Metro desde `app` con `npx expo start --dev-client --clear`. Cerrar completamente y volver a abrir la development build para descartar rutas que quedaron fallidas en Fast Refresh.
2. Con el APK que carece de módulos: abrir mapa, Perfil y reporte. Deben cargar. Pulsar Mi ubicación y Seleccionar/Reemplazar foto debe mostrar el aviso de build actualizada sin cerrar la app ni ofrecer Ajustes como remedio. Los filtros, edición y selección manual deben seguir disponibles.
3. Para usar ubicación y galería de verdad hace falta instalar una development build que incluya ambos módulos. No se ejecutó ninguna build. Recargar JS, cambiar permisos o limpiar Metro no incorpora código nativo al APK.
4. Con esa build: probar ubicación concedida/denegada/aproximada, servicios apagados, salida durante consulta; seleccionar/cancelar/reemplazar/quitar fotos en Perfil y reporte. Confirmar que solo la confirmación explícita cambia la coordenada del borrador.

No se realizaron pruebas en teléfono ni emulador. La corrección evita la importación fatal en el código; la disponibilidad real de las funciones nativas continúa dependiendo del binario instalado.

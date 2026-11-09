<p align="center">
  <img src="assets/branding/dsh-banner-en.webp" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

  # DSH Archive Manager

  **Gestión segura de sesiones archivadas en DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [Historial de cambios](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![Licencia: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![Paquete npm](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![Descargas npm](https://img.shields.io/npm/dt/%40michengai%2Fdsh-archive-manager.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
  [![Compatible con DSH hasta 0.2.2-rc.1](https://img.shields.io/badge/DSH-up%20to%200.2.2--rc.1-2563eb.svg)](#requisitos-previos)
</div>

> DSH Archive Manager es un complemento desarrollado por la comunidad para DeepSeek Harness (DSH), no es un producto oficial de DeepSeek AI.

Este documento corresponde a la versión **1.3.0**. Consulte el [registro de cambios](CHANGELOG.md) para más detalles.

## Resumen de características

Guarde conversaciones inactivas de forma segura y recupérelas cuando las necesite, manteniendo sus listas de trabajo limpias y organizadas.

- **Doble vista y acceso directo en la barra lateral**: Un icono dedicado en la barra lateral principal abre una vista centrada de **960 px** para sesiones archivadas y no archivadas, eliminando las restricciones de los diálogos estrechos.
- **Gestión completa del ciclo de vida**: Archive conversaciones individuales, espacios de trabajo enteros con un clic, lotes entre proyectos y restaure o abra sesiones directamente.
- **Clic derecho en toda la fila de la barra lateral**: Haga clic derecho en cualquier parte de una fila de espacio de trabajo o sesión en la barra lateral para abrir el menú de acciones dedicado. En filas no agrupadas o vacías se preserva el menú contextual nativo.
- **Estrella de favoritos estable y coexistencia con puntos de estado (#90, #92)**: Estrella normalizada a 16×16 px superpuesta en la ranura inicial mediante posicionamiento absoluto para evitar saltos en el título. En estados activos (en ejecución o esperando aprobación), el punto de estado del host permanece 100% visible mientras la estrella se transforma en una insignia de 10 px en la esquina inferior derecha.
- **Menú de acciones rápidas de espacio de trabajo**: Copie la ruta de la carpeta, abra la carpeta directamente en el Explorador de Windows o Finder de macOS y archive sesiones con un clic.
- **Mover sesiones entre espacios de trabajo**: Traslade sesiones de un proyecto a otro mediante un submenú desplegable, con reposo de procesos, reescritura atómica y protección para nombres con dos puntos en sistemas NTFS.
- **Tarjetas de acordeón unificadas y filas ultracompactas de 40 px**: Grupos organizados en tarjetas plegables estilo Skills Manager (cabecera de 38 px) y filas de 40 px para duplicar la densidad de información.
- **Casillas de verificación nativas en modo oscuro**: Casillas basadas en las especificaciones del host con `accent-color` nativo, integrándose a la perfección con fondos oscuros y estados activos.
- **Ventanas modales sin transparencias y accesibilidad localizada**: Montaje directo en `body` (`portalToBody`) con fondo opaco y desenfoque esmerilado para evitar superposición de textos. Etiquetas de accesibilidad completas para el botón de cierre (`common.close`).
- **ID de sección estandarizado y coexistencia (#91)**: ID registrado como `archive-manager` con protección contra fallos en tiempo de ejecución (`try/catch`), garantizando una coexistencia pacífica con complementos de terceros.
- **Barra de herramientas adaptativa en una sola línea**: Emplea el componente `Input` nativo con icono oficial de búsqueda y borde verde al enfocar. Incluye caja de búsqueda, menú de visualización y ordenación, filtro de proyectos y selector de fechas.
- **Búsqueda en texto completo y menú compuesto estilo Codex**: Búsqueda que abarca títulos y el contenido de los mensajes (usuario y asistente). Menú de dos secciones para alternar entre todas o solo favoritas y ordenar resultados.
- **Selector de fechas DateRange con popover ligero**: Reemplaza el selector de fecha nativo para evitar la inversión de colores y pérdidas de foco en modo oscuro (#74). Muestra el rango en una línea con botón para limpiar, preajustes rápidos, traducción completa de días y meses en 8 idiomas y navegación WAI-ARIA mediante teclado.
- **Limpieza automática de sesiones inactivas**: Establezca un umbral en días para detectar conversaciones sin actividad, protegiendo automáticamente tareas en ejecución, preguntas interactivas y elementos favoritos, con soporte para deshacer de inmediato.
- **Eliminación permanente**: Borrado físico y definitivo de historiales, filas de caché e índices, con posibilidad de reintentar elementos fallidos.
- **Detección y limpieza de subagentes huérfanos**: Detección de subagentes residuales cuyas sesiones principales fueron eliminadas externamente, con visualización del espacio ocupado y liberación en un clic.
- **Bloqueo empresarial por configuración Cordis y soporte para proxy inverso**: Compatible con bloqueo estricto en el archivo de configuración Cordis (`updater: false` o `onlineUpdate: false`) y resolución dinámica de rutas mediante `document.baseURI`.

## Reconstrucción manual de caché de lista (#88)

Al abrir Archive Manager se comprueban únicamente las cabeceras y las proyecciones en caché de las sesiones normales en frío en los espacios de trabajo registrados, listas sin agrupar y archivos (excluyendo sesiones especiales de canales de mensajería instantánea `im:`). Si falta la caché o no es compatible, se muestra una tarjeta de reparación para leer los registros uno a uno en modo de solo lectura y reconstruir las proyecciones mediante `coldSnapshot` oficial en `session_projcache`.

## Limpieza de subagentes huérfanos

Si una sesión principal se elimina externamente, los subagentes pueden quedar huérfanos ocupando espacio en el disco. Archive Manager los identifica en el panel de Organización y permite su eliminación física segura.

## Búsqueda y vista previa

- Ambas pestañas («Archivadas» y «No archivadas») comparten la búsqueda en títulos y contenido, selección de proyectos, favoritos, filtro de fechas y ordenación por fecha de creación.
- La vista previa muestra tablas, citas y bloques de código en formato Markdown con etiquetas de rol, o permite ver el texto original con resaltados.
- La búsqueda procesa lotes de hasta 20 sesiones secuencialmente con un máximo de 200 caracteres de consulta. Se excluyen herramientas, adjuntos, razonamientos y mensajes del sistema.

## Instalación

Se requiere un entorno DeepSeek Harness funcional. Los ejemplos utilizan el perfil `web`:

### Instalación asistida por agente
Envíe esta instrucción a un asistente con acceso a la consola:

```text
Instala la última versión de @michengai/dsh-archive-manager en mi perfil web de DSH usando el registro oficial de npm, verifica su activación y explica cómo recargar.
```

### Instalación manual

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

Reinicie DSH Web y actualice el navegador (`Ctrl+Shift+R`). Vaya a **Configuración → Sesiones archivadas** para empezar. Para actualizar, vuelva a ejecutar el comando de instalación.

- **Compatibilidad con el host**: Línea DeepSeek Harness `0.2.x` completa (`>=0.2.0-rc.1 <0.3.0-0`), verificada en todas las versiones candidatas (`0.2.0-rc.1` a `0.2.2-rc.1`).
- Los entornos anteriores a `0.2.0-rc.1` ya no son compatibles. Quienes utilicen `0.1.x` deben instalar la versión `1.0.20`.

## Configuración del complemento

Disponible en:
> **Barra lateral → Plugins → Clic en `Archive Manager`**

### 1. Ubicación del acceso (`entryLocation`)
- **Ambos sitios (`both`)**: Muestra el icono en la barra lateral izquierda y mantiene el elemento en **Configuración → Sesiones archivadas**.
- **Solo barra lateral (`sidebar`)**: Muestra el icono en la barra lateral y oculta la sección de configuración para una interfaz más despejada.
- **Solo configuración (`settings`)** (Predeterminado): Mantiene la barra lateral despejada y permite el acceso desde **Configuración → Sesiones archivadas**.

### 2. Política de actualización en línea (`onlineUpdate` / `updater`)
- En entornos empresariales o restringidos, las actualizaciones se pueden deshabilitar mediante el archivo de configuración de Cordis:
  ```yaml
  updater: false # o onlineUpdate: false
  ```
  Al desactivarse, el actualizador queda deshabilitado desde el inicio del servidor.

## Guía de uso

| Acción | Instrucciones |
| --- | --- |
| **Archivar una conversación** | Abra el menú contextual de la sesión en la barra lateral y elija **Archivar sesión** |
| **Archivar un espacio de trabajo** | Abra el menú del espacio de trabajo y seleccione **Archivar sesión** (muestra confirmación) |
| **Buscar y filtrar** | Abra **Configuración → Sesiones archivadas** o haga clic en **Archivar** en la barra lateral. La búsqueda cubre títulos y mensajes |
| **Calendario interactivo** | Haga clic en la cápsula de fecha para abrir el calendario ligero con navegación completa por teclado |
| **Vista previa rápida** | Haga clic en una coincidencia o en **Más → Vista previa rápida** para revisar el contexto sin restaurar |
| **Cambiar ordenación** | Ordene por fecha de archivado reciente, actualización, creación o título |
| **Restaurar conversación** | Haga clic en el icono de restaurar en la fila, o en **Más → Restaurar y abrir** |
| **Archivar grupo entero** | En **No archivadas**, use el menú **…** del grupo para archivar todas las sesiones del proyecto |
| **Marcar como favorita** | Haga clic en la estrella de la fila para fijarla como favorita |
| **Limpieza de sesiones inactivas** | En **No archivadas**, especifique los días de inactividad para previsualizar y limpiar |
| **Copiar ID de sesión** | Seleccione **Copiar ID de sesión** en el menú **Más** |
| **Limpiar subagentes huérfanos** | Detecte y elimine subagentes sin sesión principal en el panel de Organización |

## Preguntas frecuentes

### ¿Por qué no aparece el acceso tras instalar?
Reinicie DSH Web y fuerce la recarga de la página (`Ctrl+Shift+R`). Asegúrese de haber instalado el complemento en el perfil activo.

### ¿En qué se diferencia archivar de eliminar?
Archivar oculta la conversación manteniéndola accesible para su restauración posterior. **La eliminación definitiva no se puede deshacer** y borra los archivos físicos en disco.

### ¿Es compatible con Codex UI?
Sí. [Codex UI](https://github.com/MichengAI/dsh-codex-ui) conserva su interfaz y barra lateral, y Archive Manager queda totalmente disponible en **Configuración → Sesiones archivadas**.

### Coexistencia con otros plugins de archivo
El complemento se registra con el ID `archive-manager`, permitiendo convivir pacíficamente con otros complementos de sesiones archivadas.

## Licencia

Distribuido bajo la [Licencia Apache 2.0](LICENSE).

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
  [![Compatible con DSH hasta 0.2.2-rc.2](https://img.shields.io/badge/DSH-up%20to%200.2.2--rc.2-2563eb.svg)](#instalación)
</div>

> DSH Archive Manager es un complemento mantenido por la comunidad para DeepSeek Harness (DSH), no un producto oficial de DeepSeek AI.

Este documento corresponde a la versión **1.3.3**. Consulte el [historial de cambios](CHANGELOG.md) para versiones publicadas.

## Resumen de características

Guarde conversaciones inactivas y recupérelas cuando las necesite, manteniendo limpia su lista diaria de tareas.

- **Doble acceso y vista amplia**: Gestione sesiones desde **Configuración → Sesiones archivadas** o active el icono en la barra lateral principal para abrir un panel centrado en el área de trabajo.
- **Archivado y restauración**: Archive conversaciones individuales, espacios de trabajo completos o lotes entre proyectos, y restaure o abra sesiones directamente.
- **Búsqueda de texto completo y vista previa rápida**: Busque simultáneamente en títulos e historial de mensajes, combine filtros de proyecto, favoritos y rango de fechas con ordenación flexible, y previsualice el contexto en Markdown o texto resaltado sin restaurar.
- **Favoritos y limpieza de inactivos**: Marque chats importantes con estrella y filtre por **Solo favoritos**; previsualice y archive sesiones inactivas según días sin actividad protegiendo automáticamente tareas en curso, interacciones pendientes y favoritos, con deshacer inmediato del lote.
- **Acciones en la barra lateral y traslado entre espacios**: Haga clic derecho sobre filas de espacio de trabajo o sesión en la barra lateral para marcar como favorito, archivar, mover sesiones estándar a otro espacio de trabajo o copiar/abrir la carpeta del proyecto.
- **Limpieza de subagentes huérfanos y eliminación definitiva**: Detecte y elimine subagentes residuales cuya sesión principal fue borrada externamente, y purgue de forma permanente sesiones y registros tras confirmar.
- **Multilingüe y compatible con proxy inverso**: Compatible con los 8 idiomas integrados de DeepSeek Harness, sigue los temas claro/oscuro del sistema y funciona tras proxies inversos con prefijo de ruta.

## Capturas de pantalla

### 1. Panel de gestión de archivos

Busque, marque como favorito, previsualice, restaure y limpie en **Configuración → Sesiones archivadas → Archivados**:

![Archivados: filtros compartidos, favoritos y filas compactas](assets/screenshots/archived-sessions.webp)

Cambie a **No archivados** para previsualizar la limpieza de sesiones inactivas o archivar por proyecto:

![No archivados: limpieza inteligente y archivado por proyecto](assets/screenshots/unarchived-sessions.webp)

### 2. Panel principal del espacio de trabajo (acceso en barra lateral)

Con el acceso en la barra lateral activado, haga clic en el icono de navegación izquierdo para abrir la vista completa:

![Panel principal: acceso directo desde la barra lateral](assets/screenshots/main-view-panel.webp)

### 3. Menús contextuales de la barra lateral y traslado entre espacios

Haga clic derecho sobre cualquier fila de espacio de trabajo o sesión en la barra lateral para acceder a acciones rápidas y mover sesiones:

| Acciones de espacio de trabajo (Copiar/Abrir carpeta) | Mover sesión a otro espacio |
| :---: | :---: |
| <img src="assets/screenshots/workspace-context-menu.webp" alt="Menú de acciones de espacio de trabajo" width="100%"> | <img src="assets/screenshots/session-move-menu.webp" alt="Menú mover sesión" width="100%"> |

## Instalación

Se requiere un entorno DeepSeek Harness operativo. Los ejemplos utilizan el perfil `web`; ajústelo según su entorno.

- **Compatibilidad con el host**: Serie DeepSeek Harness `0.2.x` (`>=0.2.0-rc.1 <0.3.0-0`), verificada en todas las candidatas a lanzamiento de `0.2.x` (`0.2.0-rc.1` a `0.2.2-rc.2`; las alfas intermedias no están soportadas).
- Los hosts anteriores a `0.2.0-rc.1` ya no son compatibles y los cambios importantes de `0.3.0` quedan bloqueados por el control de versiones. Quienes usen `0.1.x` deben instalar la versión `1.0.20`.
- **Soporte para proxy inverso**: Funciona tras proxies inversos con prefijo de ruta (por ejemplo, `/app/dsh/`).

### Pedir a un agente que lo instale (recomendado)

Envíe este mensaje a un agente con acceso a la terminal:

```text
Instala la última versión de @michengai/dsh-archive-manager en mi perfil web de DSH usando el registro oficial de npm, verifica su activación y explica cómo recargar.
```

### Instalación manual y actualización

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

Reinicie DSH Web y realice una recarga forzada del navegador (`Ctrl+Shift+R`), luego abra **Configuración → Sesiones archivadas**. Para actualizar, vuelva a ejecutar el mismo comando.

## Configuración del complemento

Abra **Barra lateral → Plugins → `Archive Manager`** para ajustar:

- **Ubicación del acceso (`entryLocation`)**
  - **Ambos (`both`)**: Muestra el icono en la barra lateral izquierda y mantiene **Configuración → Sesiones archivadas**.
  - **Solo barra lateral (`sidebar`)**: Muestra el icono solo en la barra lateral izquierda y oculta la entrada en Configuración.
  - **Solo ajustes (`settings`)** (Predeterminado): Mantiene el acceso únicamente en **Configuración → Sesiones archivadas**.
- **Estrella de favoritos en barra lateral (`sidebarFavoriteStar`)**
  - **Mostrar todo (`all`)** (Predeterminado): Muestra la estrella en las filas de sesión al pasar el cursor o cuando son favoritas.
  - **Solo favoritos (`favorites`)**: Muestra la estrella fija solo en sesiones favoritas; oculta la estrella al pasar el cursor en las demás.
  - **Ocultar todo (`none`)**: Oculta las estrellas en la barra lateral (puede seguir marcando favoritos desde el menú contextual y filtrando con **Solo favoritos**).

## Guía de uso

| Acción | Cómo hacerlo |
| --- | --- |
| **Archivar sesiones** | Elija **Archivar sesión** en el menú contextual de la barra lateral, o seleccione sesiones en **No archivados** para archivar en lote |
| **Archivar espacio / grupo** | Elija **Archivar espacio de trabajo** en el menú del espacio, o use el menú **…** de un grupo en **No archivados** (ignora los filtros de búsqueda) |
| **Buscar y filtrar** | La búsqueda cubre títulos y mensajes; combine **Solo favoritos**, ordenación, proyecto y rango de fechas (el calendario incluye preajustes y navegación por teclado) |
| **Vista previa rápida** | Haga clic en un fragmento coincidente o en **Más acciones → Vista previa rápida** para revisar el contexto sin restaurar |
| **Ver o restaurar chats** | Haga clic en el título para leer y seguir conversando mientras permanece archivada; pulse restaurar o **Más acciones → Restaurar y abrir** para desarchivar |
| **Marcar como favorito** | Haga clic en la estrella de la fila o use el menú contextual de la barra lateral, y filtre con **Solo favoritos** |
| **Limpiar chats inactivos** | En **No archivados**, indique los días de inactividad (1–36.500), previsualice candidatos y confirme; use **Deshacer este archivado** antes de cerrar o recargar |
| **Mover entre espacios** | Haga clic derecho en una sesión estándar de la barra lateral y elija **Mover a espacio de trabajo** |
| **Limpiar subagentes huérfanos** | Cuando se detecten subagentes de sesiones principales borradas externamente, pulse limpiar en el panel organizador para liberar espacio |
| **Reconstruir caché de lista** | Si faltan entradas de caché oficial, aparecerá la tarjeta para reconstruir la caché leyendo los registros en modo solo lectura y restaurar títulos |
| **Eliminación definitiva** | Seleccione sesiones y pulse **Eliminar** (o use el menú contextual) para borrar registros y cachés tras confirmar |
| **Copiar ID de sesión** | Seleccione **Copiar ID de sesión** en el menú **Más acciones** |

### Notas

- **Favoritos y protección de inactivos**: Los favoritos se guardan en el host y persisten tras archivar o restaurar. La limpieza de inactivos excluye automáticamente favoritos, la sesión abierta, sesiones en ejecución e interacciones pendientes; los favoritos aún pueden archivarse manualmente. No existe archivado automático en segundo plano.
- **Alcance de búsqueda**: La búsqueda de texto incluye mensajes de usuario y asistente, excluyendo salidas de herramientas, adjuntos, razonamiento y mensajes del sistema. No hay índice persistente de texto completo; en historiales extensos conviene filtrar primero por proyecto, fecha o favoritos.
- **Operaciones por lotes y deshacer**: El archivado, restauración y eliminación en lote continúan ante fallos individuales y permiten reintentar solo los elementos fallidos. **Deshacer este archivado** solo está disponible mientras la página de gestión permanezca abierta. La eliminación definitiva es irreversible.

## Preguntas frecuentes

### ¿Por qué no aparece el acceso tras instalar?

Reinicie DSH Web, fuerce la recarga del navegador (`Ctrl+Shift+R`) y confirme que instaló en el perfil activo. Si sigue sin aparecer, ejecute el comando siguiente para comprobar que `ui-workspace-archive-manager` esté activo y que el archivo `cordis.patch.yml` del perfil no esté deshabilitando `workspace`, `session-projection-cache` o `ui-workspace`:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh --profile web --dump-config
```

### ¿En qué se diferencia archivar de eliminar permanentemente?

Archivar guarda la conversación para poder restaurarla cuando quiera. **La eliminación definitiva no se puede deshacer** y borra registros, cachés y adjuntos de la sesión (nunca borra su directorio de proyecto). Siempre requiere confirmación.

### ¿Se puede usar con Codex UI u otros plugins de archivo?

Sí. Funciona junto a [Codex UI](https://github.com/MichengAI/dsh-codex-ui), y si tiene otros complementos de archivo instalados, cada uno muestra su propia entrada en Configuración de forma independiente.

Para otros problemas, abra un [issue](https://github.com/MichengAI/dsh-archive-manager/issues) indicando versiones de DSH y del plugin, pasos para reproducirlo y detalles del error.

## Instalación desde el código fuente

<details>
<summary>Desplegar para desarrollo o pruebas de cambios no publicados</summary>

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

git clone https://github.com/MichengAI/dsh-archive-manager.git
Set-Location .\dsh-archive-manager
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
```

Reinicie DSH Web y fuerce la recarga del navegador. Tras modificar archivos en [src](src), ejecute `pnpm build` antes de confirmar cambios (comprobaciones: `pnpm typecheck`, `pnpm test`, `pnpm verify`).

</details>

## Ecosistema de productos DSH

Para un entorno de escritorio completo, descargue [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). En instalaciones existentes de [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), puede añadir los siguientes complementos según sus necesidades:

| Complemento | Capacidades principales |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Organización de proyectos, búsqueda de tareas y navegación por mensajes |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Selección y activación de agentes especialistas |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Búsqueda, activación, creación e importación de habilidades locales |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Búsqueda, restauración y limpieza física de conversaciones archivadas |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Envío y recepción de tareas mediante aplicaciones de mensajería |
| [Automation](https://github.com/MichengAI/dsh-automation) | Programación de tareas recurrentes y revisión de ejecuciones |
| [BTW](https://github.com/MichengAI/dsh-btw) | Preguntas paralelas sin interrumpir la tarea en curso |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Uso de `/simplify` para mejorar el código de sus cambios en Git |
| [PUA](https://github.com/MichengAI/dsh-pua) | Motivación al agente para diagnosticar causas de fallo y verificar antes de concluir |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Revisión de código independiente con `/review` en la conversación actual |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Notificaciones y aprobaciones de herramientas a través de una mascota de escritorio |

## Licencia

Distribuido bajo la [Licencia Apache 2.0](LICENSE).

# UAP Integration Plugin

Plugin de WordPress para integrar el sistema UAP Analysis con tu sitio web.

## Características

- 📚 **Biblioteca Visual**: Muestra objetos y fenómenos UAP categorizados
- 🛸 **Formulario de Reportes**: Permite a usuarios reportar avistamientos
- 🔬 **Galería de Análisis**: Muestra análisis públicos realizados por el sistema
- ⚙️ **Configuración Flexible**: Panel de administración para configurar la URL de la API

## Instalación

1. El plugin ya está instalado en: `wp-content/plugins/uap-integration/`
2. Ve a **Plugins** en el panel de WordPress
3. Busca "UAP Integration" y actívalo
4. Ve a **UAP Integration** en el menú lateral para configurar

## Configuración

1. En el panel de WordPress, ve a **UAP Integration**
2. Verifica que la URL de la API sea correcta (por defecto: `http://localhost:3000/api`)
3. Haz clic en "Probar Conexión" para verificar que funciona
4. Guarda los cambios

## Shortcodes

### Biblioteca Visual
```
[uap-biblioteca]
```
Muestra la biblioteca completa de objetos y fenómenos categorizados.

### Formulario de Reporte
```
[uap-reportar]
```
Formulario público para que los usuarios reporten avistamientos.

### Galería de Análisis
```
[uap-galeria]
```
Muestra los análisis públicos realizados por el sistema.

## Uso

### Crear una página con la Biblioteca

1. Ve a **Páginas > Añadir nueva**
2. Título: "Biblioteca UAP"
3. En el contenido, agrega: `[uap-biblioteca]`
4. Publica la página

### Crear una página de Reportes

1. Ve a **Páginas > Añadir nueva**
2. Título: "Reportar Avistamiento"
3. En el contenido, agrega: `[uap-reportar]`
4. Publica la página

### Crear una página con la Galería

1. Ve a **Páginas > Añadir nueva**
2. Título: "Análisis UAP"
3. En el contenido, agrega: `[uap-galeria]`
4. Publica la página

## Requisitos

- WordPress 5.0 o superior
- PHP 7.4 o superior
- Servidor Node.js con el sistema UAP corriendo (puerto 3000 por defecto)
- MongoDB con los datos del sistema UAP

## Soporte

Para problemas o preguntas, visita el repositorio:
https://github.com/ufoteoria-sudo/PROYECT-OVNI-ESP

## Licencia

GPL-2.0+

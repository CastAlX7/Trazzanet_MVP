# TrazaNet - Servidor Backend Local

## Descripción

Servidor backend local para TrazaNet que reemplaza la funcionalidad de Firebase. Proporciona endpoints para la carga de archivos y gestión del historial de trazabilidad.

## Requisitos

- Node.js (versión 14 o superior)
- npm (incluido con Node.js)

## Instalación

1. Abre una terminal en el directorio del proyecto:
```bash
cd c:\Users\ander\OneDrive\Escritorio\TrazaNet
```

2. Instala las dependencias:
```bash
npm install
```

## Ejecución

Para iniciar el servidor:

```bash
npm start
```

O alternativamente:

```bash
node server.js
```

El servidor se iniciará en `http://localhost:3000`

## Endpoints de la API

### 1. Health Check
**GET** `/api/health`

Verifica que el servidor está funcionando correctamente.

**Respuesta:**
```json
{
  "status": "ok",
  "message": "Servidor TrazaNet funcionando correctamente",
  "timestamp": "2025-11-22T07:20:00.000Z"
}
```

### 2. Subir Archivo
**POST** `/api/upload`

Sube un archivo de trazabilidad y lo registra en el historial.

**Parámetros:**
- `file` (FormData): Archivo a subir (.csv, .xlsx)
- `userId` (string): ID del usuario que realiza la carga

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Archivo cargado exitosamente",
  "data": {
    "id": "1700000000000-abc123",
    "fileName": "trazabilidad.csv",
    "savedFileName": "1700000000000-123456789-trazabilidad.csv",
    "size": 12345,
    "date": "2025-11-22T07:20:00.000Z",
    "status": "Completada",
    "transactionId": "0x1234567890abcdef...",
    "processedBy": "user-12345",
    "filePath": "uploads/1700000000000-123456789-trazabilidad.csv"
  }
}
```

### 3. Obtener Historial
**GET** `/api/history`

Obtiene el historial de todas las cargas realizadas.

**Parámetros opcionales:**
- `userId` (query): Filtrar por ID de usuario

**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "1700000000000-abc123",
      "fileName": "trazabilidad.csv",
      "size": 12345,
      "date": "2025-11-22T07:20:00.000Z",
      "status": "Completada",
      "transactionId": "0x1234567890abcdef...",
      "processedBy": "user-12345"
    }
  ]
}
```

### 4. Eliminar Registro
**DELETE** `/api/history/:id`

Elimina un registro del historial y su archivo asociado.

**Parámetros:**
- `id` (URL): ID del registro a eliminar

**Respuesta:**
```json
{
  "success": true,
  "message": "Registro eliminado exitosamente"
}
```

## Estructura de Archivos

```
TrazaNet/
├── server.js                 # Servidor Express
├── package.json              # Dependencias del proyecto
├── uploads/                  # Carpeta donde se guardan los archivos (creada automáticamente)
├── uploads-history.json      # Historial de cargas (creado automáticamente)
└── carga.html               # Frontend modificado para usar localhost
```

## Almacenamiento de Datos

- **Archivos subidos**: Se guardan en la carpeta `uploads/` con un nombre único
- **Historial**: Se almacena en `uploads-history.json` en formato JSON
- **Persistencia**: Los datos persisten entre reinicios del servidor

## Notas Importantes

1. El servidor debe estar ejecutándose para que `carga.html` funcione correctamente
2. Los archivos tienen un límite de tamaño de 10MB
3. El historial se guarda automáticamente con cada carga
4. Los IDs de transacción son simulados (hash hexadecimal aleatorio)

## Solución de Problemas

### El servidor no inicia
- Verifica que Node.js esté instalado: `node --version`
- Asegúrate de haber ejecutado `npm install`
- Verifica que el puerto 3000 no esté en uso

### Error al subir archivos
- Verifica que el servidor esté ejecutándose
- Comprueba que el archivo no exceda 10MB
- Revisa la consola del servidor para ver errores detallados

### El historial no se carga
- Verifica que `uploads-history.json` exista y tenga formato JSON válido
- Comprueba los permisos de escritura en el directorio del proyecto

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

// ::Usa el puerto dinámico de Render. En server.js, reemplaza la línea donde defines
// Render inyecta una variable de entorno PORT para cada servicio, por lo que tu aplicación debe respetarla.
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(__dirname)); // Servir archivos estáticos desde la raíz
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de Multer para guardar archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

// Archivos para almacenar datos
const HISTORY_FILE = path.join(__dirname, 'uploads-history.json');
const CERTIFICATIONS_FILE = path.join(__dirname, 'certifications.json');

// Función para leer el historial
function readHistory() {
    if (!fs.existsSync(HISTORY_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer historial:', error);
        return [];
    }
}

// Función para guardar el historial
function saveHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error al guardar historial:', error);
        return false;
    }
}

// Función para leer certificaciones
function readCertifications() {
    if (!fs.existsSync(CERTIFICATIONS_FILE)) {
        // Crear certificaciones por defecto
        const defaultCerts = [
            {
                id: 'globalgap',
                name: 'Auditoría GlobalG.A.P.',
                description: 'Certificación de buenas prácticas agrícolas para productos frescos.',
                rulesCount: 12,
                externalLink: 'https://www.globalgap.org/',
                createdAt: new Date().toISOString()
            },
            {
                id: 'clientex',
                name: 'Certificación Cliente X',
                description: 'Estándares específicos para el cliente mayorista "Cliente X".',
                rulesCount: 8,
                externalLink: '',
                createdAt: new Date().toISOString()
            },
            {
                id: 'iso22000',
                name: 'ISO 22000: Seguridad Alimentaria',
                description: 'Gestión de la seguridad alimentaria en toda la cadena de suministro.',
                rulesCount: 15,
                externalLink: 'https://www.iso.org/iso-22000-food-safety-management.html',
                createdAt: new Date().toISOString()
            },
            {
                id: 'brcgs',
                name: 'BRCGS Global Standard for Food Safety',
                description: 'Estándar global para la seguridad alimentaria, calidad y operación.',
                rulesCount: 10,
                externalLink: 'https://www.brcgs.com/',
                createdAt: new Date().toISOString()
            }
        ];
        saveCertifications(defaultCerts);
        return defaultCerts;
    }
    try {
        const data = fs.readFileSync(CERTIFICATIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer certificaciones:', error);
        return [];
    }
}

// Función para guardar certificaciones
function saveCertifications(certifications) {
    try {
        fs.writeFileSync(CERTIFICATIONS_FILE, JSON.stringify(certifications, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error al guardar certificaciones:', error);
        return false;
    }
}

// Función para generar hash de transacción simulado
function generateTransactionHash() {
    return '0x' + (Math.random() * 1e32).toString(16).substring(0, 32);
}

// ===============================================
// ENDPOINTS DE LA API
// ===============================================

// GET /api/health - Verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor TrazaNet funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// POST /api/upload - Subir archivo y registrar en historial
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se recibió ningún archivo'
            });
        }

        const userId = req.body.userId || 'anonymous';
        const transactionHash = generateTransactionHash();

        // Leer y analizar el archivo CSV real
        let totalFrutas = 0;
        let frutasConformes = 0;
        let frutasConHallazgos = 0;
        let frutasNoAdmitidas = 0;
        const defectos = [];

        try {
            // Leer el contenido del archivo CSV
            const csvContent = fs.readFileSync(req.file.path, 'utf8');
            const lines = csvContent.split('\n').filter(line => line.trim() !== '');

            console.log(`📄 Procesando archivo CSV con ${lines.length} líneas`);

            if (lines.length > 1) {
                // La primera línea son los encabezados
                const headers = lines[0].split(',').map(h => h.trim());
                console.log(`📋 Encabezados encontrados: ${headers.join(', ')}`);

                // Buscar el índice de la columna CALIDAD_STATUS
                const statusIndex = headers.findIndex(h => h.toUpperCase() === 'CALIDAD_STATUS');
                console.log(`🔍 Índice de CALIDAD_STATUS: ${statusIndex}`);

                // Procesar cada línea de datos (saltando el encabezado)
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());

                    // Verificar que la línea tenga suficientes columnas
                    if (values.length >= headers.length && values.join('').length > 0) {
                        totalFrutas++;

                        // Obtener el estado de calidad
                        const status = statusIndex >= 0 ? values[statusIndex].trim().toUpperCase() : 'OK';
                        console.log(`  Línea ${i}: Status = "${status}"`);

                        if (status === 'OK' || status === 'CONFORME') {
                            frutasConformes++;
                        } else if (status === 'ALERTA' || status === 'HALLAZGO') {
                            frutasConHallazgos++;
                        } else if (status === 'DESCARTE' || status === 'NO_ADMITIDA' || status === 'RECHAZADO') {
                            frutasNoAdmitidas++;
                        } else {
                            // Si no se reconoce el estado, considerarlo conforme
                            console.log(`  ⚠️ Estado no reconocido: "${status}", considerando como OK`);
                            frutasConformes++;
                        }
                    }
                }
            }

            // Si no se encontraron datos, usar valores por defecto
            if (totalFrutas === 0) {
                console.log('⚠️ No se encontraron datos en el CSV, usando valores por defecto');
                totalFrutas = 1;
                frutasConformes = 1;
            }

            // Calcular porcentajes
            const porcentajeNoAdmitida = (frutasNoAdmitidas / totalFrutas * 100);
            const porcentajeHallazgos = (frutasConHallazgos / totalFrutas * 100);
            const porcentajeConformes = (frutasConformes / totalFrutas * 100);

            // Generar defectos basados en los datos reales
            if (frutasNoAdmitidas > 0) {
                defectos.push({
                    nombre: 'Fruta No Admitida',
                    cantidad: frutasNoAdmitidas,
                    severidad: 'No Admitida',
                    porcentaje: parseFloat(porcentajeNoAdmitida.toFixed(2))
                });
            }

            if (frutasConHallazgos > 0) {
                defectos.push({
                    nombre: 'Fruta con Alerta',
                    cantidad: frutasConHallazgos,
                    severidad: 'Hallazgo',
                    porcentaje: parseFloat(porcentajeHallazgos.toFixed(2))
                });
            }

            console.log(`📊 Estadísticas del archivo:`);
            console.log(`   Total: ${totalFrutas}`);
            console.log(`   Conformes: ${frutasConformes} (${porcentajeConformes.toFixed(2)}%)`);
            console.log(`   Hallazgos: ${frutasConHallazgos} (${porcentajeHallazgos.toFixed(2)}%)`);
            console.log(`   No Admitidas: ${frutasNoAdmitidas} (${porcentajeNoAdmitida.toFixed(2)}%)`);

        } catch (parseError) {
            console.error('❌ Error al parsear CSV:', parseError);
            // Si hay error, usar valores por defecto
            totalFrutas = 1;
            frutasConformes = 1;
            frutasConHallazgos = 0;
            frutasNoAdmitidas = 0;
        }

        // Calcular porcentajes finales
        const porcentajeNoAdmitida = (frutasNoAdmitidas / totalFrutas * 100);

        // Crear registro de carga
        const uploadRecord = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            fileName: req.file.originalname,
            savedFileName: req.file.filename,
            size: req.file.size,
            date: new Date().toISOString(),
            status: 'Completada',
            transactionId: transactionHash,
            processedBy: userId,
            filePath: req.file.path,
            // Datos de calidad de fruta
            calidadFruta: {
                total: totalFrutas,
                conformes: frutasConformes,
                hallazgosMenores: frutasConHallazgos,
                noAdmitidas: frutasNoAdmitidas,
                porcentajeNoAdmitida: parseFloat(porcentajeNoAdmitida.toFixed(2)),
                porcentajeConformes: parseFloat((frutasConformes / totalFrutas * 100).toFixed(2)),
                porcentajeHallazgos: parseFloat((frutasConHallazgos / totalFrutas * 100).toFixed(2)),
                defectos: defectos
            }
        };

        // Leer historial actual
        const history = readHistory();

        // Agregar nuevo registro
        history.push(uploadRecord);

        // Guardar historial actualizado
        if (!saveHistory(history)) {
            return res.status(500).json({
                success: false,
                message: 'Error al guardar el historial'
            });
        }

        console.log(`✅ Archivo subido: ${req.file.originalname} por usuario ${userId}`);

        res.json({
            success: true,
            message: 'Archivo cargado exitosamente',
            data: uploadRecord
        });

    } catch (error) {
        console.error('❌ Error en /api/upload:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la carga: ' + error.message
        });
    }
});

// GET /api/history - Obtener historial de cargas
app.get('/api/history', (req, res) => {
    try {
        const userId = req.query.userId;
        let history = readHistory();

        // Si se proporciona userId, filtrar por ese usuario
        if (userId) {
            history = history.filter(record => record.processedBy === userId);
        }

        // Ordenar por fecha (más reciente primero)
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        console.error('❌ Error en /api/history:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial: ' + error.message
        });
    }
});

// DELETE /api/history/:id - Eliminar un registro del historial (opcional)
app.delete('/api/history/:id', (req, res) => {
    try {
        const recordId = req.params.id;
        let history = readHistory();

        const recordIndex = history.findIndex(record => record.id === recordId);

        if (recordIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        // Eliminar archivo físico si existe
        const record = history[recordIndex];
        if (record.filePath && fs.existsSync(record.filePath)) {
            fs.unlinkSync(record.filePath);
        }

        // Eliminar del historial
        history.splice(recordIndex, 1);
        saveHistory(history);

        res.json({
            success: true,
            message: 'Registro eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en DELETE /api/history:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el registro: ' + error.message
        });
    }
});

// GET /api/uploads/:filename - Servir archivo subido
app.get('/api/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    // Seguridad: Evitar Directory Traversal
    if (!filePath.startsWith(path.join(__dirname, 'uploads'))) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado'
        });
    }

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({
            success: false,
            message: 'Archivo no encontrado'
        });
    }
});

// POST /api/update-simulation - Actualizar resultado de simulación
app.post('/api/update-simulation', (req, res) => {
    try {
        const { loteId, simResult } = req.body;

        if (!loteId || !simResult) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere loteId y simResult'
            });
        }

        let history = readHistory();
        const recordIndex = history.findIndex(record => record.id === loteId);

        if (recordIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Lote no encontrado'
            });
        }

        // Actualizar el resultado de simulación
        history[recordIndex].simResult = simResult;
        history[recordIndex].lastSimulation = new Date().toISOString();

        if (!saveHistory(history)) {
            return res.status(500).json({
                success: false,
                message: 'Error al guardar el resultado'
            });
        }

        res.json({
            success: true,
            message: 'Resultado de simulación actualizado',
            data: history[recordIndex]
        });

    } catch (error) {
        console.error('❌ Error en POST /api/update-simulation:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar simulación: ' + error.message
        });
    }
});

// ===============================================
// ENDPOINTS DE CERTIFICACIONES
// ===============================================

// GET /api/certifications - Obtener todas las certificaciones
app.get('/api/certifications', (req, res) => {
    try {
        const certifications = readCertifications();
        res.json({
            success: true,
            count: certifications.length,
            data: certifications
        });
    } catch (error) {
        console.error('❌ Error en GET /api/certifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener certificaciones: ' + error.message
        });
    }
});

// POST /api/certifications - Crear nueva certificación
app.post('/api/certifications', (req, res) => {
    try {
        const { name, description, rulesCount, externalLink } = req.body;

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere nombre y descripción'
            });
        }

        const certifications = readCertifications();
        const newCert = {
            id: 'cert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name,
            description,
            rulesCount: rulesCount || 0,
            externalLink: externalLink || '',
            createdAt: new Date().toISOString()
        };

        certifications.push(newCert);
        saveCertifications(certifications);

        res.json({
            success: true,
            message: 'Certificación creada exitosamente',
            data: newCert
        });
    } catch (error) {
        console.error('❌ Error en POST /api/certifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear certificación: ' + error.message
        });
    }
});

// PUT /api/certifications/:id - Actualizar certificación
app.put('/api/certifications/:id', (req, res) => {
    try {
        const certId = req.params.id;
        const { name, description, rulesCount, externalLink } = req.body;

        let certifications = readCertifications();
        const certIndex = certifications.findIndex(cert => cert.id === certId);

        if (certIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Certificación no encontrada'
            });
        }

        certifications[certIndex] = {
            ...certifications[certIndex],
            name: name || certifications[certIndex].name,
            description: description || certifications[certIndex].description,
            rulesCount: rulesCount !== undefined ? rulesCount : certifications[certIndex].rulesCount,
            externalLink: externalLink !== undefined ? externalLink : certifications[certIndex].externalLink,
            updatedAt: new Date().toISOString()
        };

        saveCertifications(certifications);

        res.json({
            success: true,
            message: 'Certificación actualizada exitosamente',
            data: certifications[certIndex]
        });
    } catch (error) {
        console.error('❌ Error en PUT /api/certifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar certificación: ' + error.message
        });
    }
});

// DELETE /api/certifications/:id - Eliminar certificación
app.delete('/api/certifications/:id', (req, res) => {
    try {
        const certId = req.params.id;
        let certifications = readCertifications();
        const certIndex = certifications.findIndex(cert => cert.id === certId);

        if (certIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Certificación no encontrada'
            });
        }

        certifications.splice(certIndex, 1);
        saveCertifications(certifications);

        res.json({
            success: true,
            message: 'Certificación eliminada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error en DELETE /api/certifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar certificación: ' + error.message
        });
    }
});

// ===============================================
// ENDPOINTS DE DASHBOARD
// ===============================================

// GET /api/dashboard/stats - Obtener estadísticas del dashboard
app.get('/api/dashboard/stats', (req, res) => {
    try {
        const userId = req.query.userId;
        let history = readHistory();

        if (userId) {
            history = history.filter(record => record.processedBy === userId);
        }

        const lotesActivos = history.length;
        const transaccionesConfirmadas = history.length * 3; // Simulado: 3 transacciones por lote
        const alertasCriticas = history.filter(record =>
            record.calidadFruta && record.calidadFruta.porcentajeNoAdmitida > 20
        ).length;

        res.json({
            success: true,
            data: {
                lotesActivos,
                transaccionesConfirmadas,
                alertasCriticas,
                metricas: {
                    temperatura: 95,
                    humedad: 80,
                    origenVerificado: 100
                }
            }
        });
    } catch (error) {
        console.error('❌ Error en GET /api/dashboard/stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas: ' + error.message
        });
    }
});

// ===============================================
// ENDPOINTS DE TRAZABILIDAD
// ===============================================

// GET /api/traceability - Obtener datos de trazabilidad
app.get('/api/traceability', (req, res) => {
    try {
        const userId = req.query.userId;
        let history = readHistory();

        if (userId) {
            history = history.filter(record => record.processedBy === userId);
        }

        // Generar eventos de trazabilidad para cada lote
        const traceabilityEvents = [];

        history.forEach(record => {
            const loteId = record.id.substring(0, 8).toUpperCase();
            const uploadDate = new Date(record.date);

            // Evento 1: Cosecha
            traceabilityEvents.push({
                fecha: new Date(uploadDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                loteId: `AVO-${loteId}`,
                productoId: 'N/A',
                evento: 'Cosecha',
                descripcion: 'Recolección manual de aguacates',
                ubicacion: 'Finca El Paraíso, México',
                estadoTx: 'Confirmado',
                blockchainTxId: generateTransactionHash().substring(0, 12) + '...'
            });

            // Evento 2: Recepción
            traceabilityEvents.push({
                fecha: new Date(uploadDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                loteId: `AVO-${loteId}`,
                productoId: 'N/A',
                evento: 'Recepción',
                descripcion: 'Lote recibido en centro de procesamiento',
                ubicacion: 'Centro Procesador Guadalajara',
                estadoTx: 'Confirmado',
                blockchainTxId: generateTransactionHash().substring(0, 12) + '...'
            });

            // Evento 3: Carga de datos
            traceabilityEvents.push({
                fecha: record.date,
                loteId: `AVO-${loteId}`,
                productoId: 'N/A',
                evento: 'Carga de Datos',
                descripcion: `Archivo ${record.fileName} cargado al sistema`,
                ubicacion: 'Sistema TrazaNet',
                estadoTx: 'Confirmado',
                blockchainTxId: record.transactionId.substring(0, 12) + '...'
            });
        });

        // Ordenar por fecha descendente
        traceabilityEvents.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        res.json({
            success: true,
            count: traceabilityEvents.length,
            data: traceabilityEvents
        });
    } catch (error) {
        console.error('❌ Error en GET /api/traceability:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener trazabilidad: ' + error.message
        });
    }
});

// GET /api/batch/:id - Obtener detalles de un lote específico
app.get('/api/batch/:id', (req, res) => {
    try {
        const batchId = req.params.id;
        const history = readHistory();
        const batch = history.find(record => record.id === batchId);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Lote no encontrado'
            });
        }

        res.json({
            success: true,
            data: batch
        });
    } catch (error) {
        console.error('❌ Error en GET /api/batch:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener lote: ' + error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Servidor TrazaNet Backend Iniciado                  ║
║                                                           ║
║   📡 Puerto: ${PORT}                                         ║
║   🌐 URL: http://localhost:${PORT}                           ║
║   📁 Directorio de uploads: ./uploads                     ║
║   📊 Archivo de historial: ./uploads-history.json        ║
║                                                           ║
║   Endpoints disponibles:                                  ║
║   - GET    /api/health                                    ║
║   - POST   /api/upload                                    ║
║   - GET    /api/history                                   ║
║   - POST   /api/update-simulation                         ║
║   - DELETE /api/history/:id                               ║
║   - GET    /api/certifications                            ║
║   - POST   /api/certifications                            ║
║   - PUT    /api/certifications/:id                        ║
║   - DELETE /api/certifications/:id                        ║
║   - GET    /api/dashboard/stats                           ║
║   - GET    /api/traceability                              ║
║   - GET    /api/batch/:id                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

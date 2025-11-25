// Archivo: Recursos/js/auditoriaLogic.js
// Contiene la lógica para la simulación de auditoría, manejo de datos y visualización del gráfico.

// =================================
// CONFIGURACIÓN DE DATOS INICIALES (CORREGIDO PARA PALTA/AGUACATE)
// =================================

// Lista inicial de lotes para simulación. Todos son Palta Hass.
let lotesData = [
    { id: 'PALTA-A-001', name: 'Palta Hass Lote A (Michoacán)', rulesPassed: 95, status: 'Aprobado', reason: 'Cumplimiento excelente en análisis de residuos.' },
    { id: 'PALTA-B-002', name: 'Palta Hass Lote B (Jalisco)', rulesPassed: 80, status: 'En Riesgo', reason: 'Temperatura en almacén ligeramente elevada (+2.5°C).' },
    { id: 'PALTA-C-003', name: 'Palta Hass Lote C (Exportación)', rulesPassed: 70, status: 'Fallido', reason: 'Trazabilidad incompleta de fungicidas aplicados.' },
    { id: 'PALTA-D-004', name: 'Palta Hass Lote D (Mercado Local)', rulesPassed: 99, status: 'Aprobado', reason: 'Cumplimiento perfecto. Todos los puntos ok.' },
    { id: 'PALTA-E-005', name: 'Palta Hass Lote E (Añadir)', rulesPassed: 85, status: 'Aprobado', reason: 'Buena gestión de humedad y ventilación.' },
];

// Variables para el Chart.js
let auditoriaChart = null;

// =================================
// UTILIDADES
// =================================

/**
 * Muestra un modal o mensaje personalizado en lugar de alert().
 * @param {string} title - Título del mensaje.
 * @param {string} message - Contenido del mensaje.
 */
function showCustomMessage(title, message) {
    console.log(`[Mensaje ${title}]: ${message}`);
    // En un entorno de producción, aquí se implementaría un modal
    // personalizado con HTML/CSS para evitar el molesto alert() del navegador.
    // Por simplicidad, usaremos console.log.
}

/**
 * Genera una clase de color basada en el estado del lote.
 * @param {string} status - Estado del lote ('Aprobado', 'En Riesgo', 'Fallido').
 * @returns {string} - Clases de Tailwind para el badge.
 */
function getStatusBadge(status) {
    switch (status) {
        case 'Aprobado':
            return 'bg-green-100 text-green-700 ring-green-600/20';
        case 'En Riesgo':
            return 'bg-orange-100 text-orange-700 ring-orange-600/20';
        case 'Fallido':
            return 'bg-red-100 text-red-700 ring-red-600/20';
        default:
            return 'bg-gray-100 text-gray-700 ring-gray-600/20';
    }
}

// =================================
// LÓGICA DE VISUALIZACIÓN
// =================================

/**
 * Inicializa o actualiza el gráfico de distribución de resultados.
 * @param {object} counts - Objeto con el recuento de estados {aprobado, enRiesgo, fallido}.
 */
function updateChart(counts) {
    const ctx = document.getElementById('auditoriaChart').getContext('2d');

    const data = {
        labels: ['Aprobado', 'En Riesgo', 'Fallido'],
        datasets: [{
            label: '# de Lotes',
            data: [counts.aprobado, counts.enRiesgo, counts.fallido],
            backgroundColor: [
                'rgba(16, 185, 129, 0.7)', // green-500
                'rgba(245, 158, 11, 0.7)',  // orange-500
                'rgba(239, 68, 68, 0.7)',  // red-500
            ],
            borderColor: [
                'rgb(16, 185, 129)',
                'rgb(245, 158, 11)',
                'rgb(239, 68, 68)',
            ],
            borderWidth: 1
        }]
    };

    const config = {
        type: 'doughnut', // Gráfico tipo dona o pie
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            }
        },
    };

    if (auditoriaChart) {
        // Si el gráfico ya existe, solo actualiza los datos
        auditoriaChart.data = data;
        auditoriaChart.update();
    } else {
        // Si no existe, créalo
        auditoriaChart = new Chart(ctx, config);
    }
}

/**
 * Renderiza la tabla de lotes auditados.
 */
function renderTable() {
    const tableBody = document.getElementById('auditoria-table-body');
    if (!tableBody) return;

    // Limpiar filas existentes
    tableBody.innerHTML = '';

    lotesData.forEach(lote => {
        const statusBadge = getStatusBadge(lote.status);
        
        const row = `
            <tr class="hover:bg-gray-50 transition duration-150 ease-in-out">
                <td class="px-6 py-4 font-medium text-gray-900">${lote.id}</td>
                <td class="px-6 py-4">${lote.name}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusBadge}">
                        ${lote.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">${lote.rulesPassed}%</td>
                <td class="px-6 py-4 text-gray-600">${lote.reason}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="viewDetails('${lote.id}')" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        Ver Detalle
                    </button>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

/**
 * Renderiza los KPIs de la cabecera.
 */
function renderKPIs() {
    const counts = lotesData.reduce((acc, lote) => {
        if (lote.status === 'Aprobado') acc.aprobado++;
        else if (lote.status === 'En Riesgo') acc.enRiesgo++;
        else if (lote.status === 'Fallido') acc.fallido++;
        return acc;
    }, { aprobado: 0, enRiesgo: 0, fallido: 0 });

    const totalLotes = lotesData.length;
    const tasaExito = totalLotes > 0 ? ((counts.aprobado / totalLotes) * 100).toFixed(1) : '0.0';

    // Actualizar elementos del DOM (usando los textos simulados por ahora)
    document.querySelector('.grid-cols-4 > div:nth-child(1) h3').textContent = counts.aprobado;
    document.querySelector('.grid-cols-4 > div:nth-child(2) h3').textContent = counts.enRiesgo;
    document.querySelector('.grid-cols-4 > div:nth-child(3) h3').textContent = counts.fallido;
    document.querySelector('.grid-cols-4 > div:nth-child(4) h3').textContent = `${tasaExito}%`;

    // Actualizar el gráfico
    updateChart(counts);
}

// =================================
// LÓGICA DE SIMULACIÓN
// =================================

/**
 * Simula el proceso de auditoría para un lote.
 * @param {object} lote - El lote a auditar.
 * @returns {object} - El lote con el resultado de la auditoría.
 */
function simulateAudit(lote) {
    // Generar un número aleatorio de reglas cumplidas (entre 50 y 100)
    const rulesPassed = Math.floor(Math.random() * (100 - 50 + 1)) + 50;

    let status = 'Aprobado';
    let reason = 'Cumplimiento excelente en todos los puntos de la normativa.';

    if (rulesPassed < 90 && rulesPassed >= 75) {
        status = 'En Riesgo';
        // Simulación de motivos específicos para la palta
        const riskReasons = [
            'Bajo nivel de madurez (etapa 3 en lugar de 4).',
            'pH del suelo en el campo de origen fuera de rango óptimo.',
            'Documentación de calibración de sensores de frío próxima a vencer.',
            `Bajo cumplimiento de métricas (Reglas Cumplidas: ${rulesPassed}%). Se requiere plan de acción.`,
        ];
        reason = riskReasons[Math.floor(Math.random() * riskReasons.length)];
    } else if (rulesPassed < 75) {
        status = 'Fallido';
        // Simulación de fallos específicos para la palta
        const failureReasons = [
            'Detección de residuos de pesticida (límite excedido).',
            'Trazabilidad incompleta de insumos (fertilizante o fungicida).',
            'Cadena de frío rota durante el transporte primario.',
            `Incumplimiento crítico de la normativa. Falla en control de calidad. (Reglas Cumplidas: ${rulesPassed}%)`,
        ];
        reason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
    }

    return {
        ...lote,
        rulesPassed,
        status,
        reason,
    };
}

/**
 * Función principal que ejecuta la simulación de auditoría en todos los lotes.
 */
function executeSimulation() {
    // 1. Obtener la normativa seleccionada (aunque la lógica de simulación es simple por ahora)
    const normativa = document.getElementById('normativa').value;

    showCustomMessage('Simulación Iniciada', `Ejecutando simulación de auditoría bajo la normativa: ${normativa} para lotes de Palta Hass...`);

    // 2. Simular nuevos resultados para los lotes existentes
    const newLotesData = lotesData.map(lote => simulateAudit(lote));

    // 3. Opcional: Añadir un nuevo lote para mostrar dinamismo
    if (Math.random() > 0.6) { // 40% de probabilidad de añadir un nuevo lote simulado
        const newId = 'PALTA-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const newLote = simulateAudit({ id: newId, name: `Palta Hass Lote Fresco ${newId}`, rulesPassed: 0, status: '', reason: '' });
        newLotesData.unshift(newLote); // Añadir al inicio
    }

    // 4. Actualizar los datos globales
    lotesData = newLotesData;

    // 5. Renderizar
    renderKPIs();
    renderTable();
    
    // 6. Actualizar el footer de la última ejecución
    const footer = document.querySelector('.bg-gray-50.border-t');
    const now = new Date();
    footer.innerHTML = `Última simulación ejecutada: ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

    showCustomMessage('Simulación Completa', `La auditoría de Palta Hass ha finalizado. ${lotesData.filter(l => l.status === 'Fallido').length} lotes fallaron la prueba.`);
}

/**
 * Acción para el botón "Ver Detalle" (simula una navegación a una página de detalle).
 * @param {string} loteId - El ID del lote.
 */
function viewDetails(loteId) {
    const lote = lotesData.find(l => l.id === loteId);
    if (lote) {
        showCustomMessage(`Detalles del Lote ${loteId}`, `Mostrando el reporte completo de trazabilidad y auditoría para el lote ${lote.name}.\n\nEstado: ${lote.status}\nReglas Cumplidas: ${lote.rulesPassed}%\nMotivo: ${lote.reason}`);
        // En un entorno real, aquí harías: window.location.href = `auditoria_detalle.html?id=${loteId}`;
    }
}

// Hacer viewDetails accesible globalmente para el onclick en la tabla
window.viewDetails = viewDetails;


// =================================
// INICIALIZACIÓN
// =================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📝 AuditoriaLogic.js cargado.');

    const simularBtn = document.getElementById('btn-simular');
    if (simularBtn) {
        simularBtn.addEventListener('click', executeSimulation);
    }

    // Cargar el estado inicial (renderizar KPIs, tabla y gráfico)
    renderKPIs();
    renderTable();
});
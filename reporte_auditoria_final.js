const API_BASE_URL = '/api';
let trendChartInstance = null;
let breakdownChartInstance = null;
let allHistoryData = [];

// ===============================================
// DATA FETCHING
// ===============================================

async function fetchHistoryData() {
    try {
        // Get the current user ID from session storage
        const userId = sessionStorage.getItem('trazanet_user_id');

        // Construct URL with userId if available to filter data for the current user
        const url = userId
            ? `${API_BASE_URL}/history?userId=${userId}`
            : `${API_BASE_URL}/history`;

        console.log(`Fetching history from: ${url}`); // Debug log

        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener historial');
        const result = await response.json();
        if (result.success) {
            console.log(`Loaded ${result.data.length} records.`); // Debug log
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching history:', error);
        return [];
    }
}

function determineBatchStatus(record) {
    // Determine status based on ACTUAL data from the CSV (calidadFruta)
    // We prioritize the parsed data over the 'simResult'
    if (!record.calidadFruta) return 'Pendiente';

    const { porcentajeNoAdmitida, porcentajeHallazgos } = record.calidadFruta;

    // Logic: 
    // > 15% No Admitida -> Descarte
    // > 0% Hallazgos -> Hallazgo
    // Else -> Conforme

    if (porcentajeNoAdmitida > 15) {
        return 'Descarte';
    } else if (porcentajeHallazgos > 0 || porcentajeNoAdmitida > 0) {
        return 'Hallazgo';
    } else {
        return 'Conforme';
    }
}

function processData(data, filter) {
    let filteredData = data;
    if (filter !== 'Global') {
        // Future filtering logic by filename if needed
        // filteredData = data.filter(d => d.fileName === filter);
    }

    const totalAudits = filteredData.length;

    // If no data, return empty structure with safe defaults
    if (totalAudits === 0) {
        return {
            kpis: {
                conformidad: 0,
                rechazados: 0,
                tiempo: "N/A",
                completadas: 0
            },
            charts: {
                trend: { labels: [], data: [] },
                breakdown: { labels: [], data: [] }
            }
        };
    }

    let totalConformitySum = 0;
    let rejectedCount = 0;

    const statusCounts = {
        'Conforme': 0,
        'Hallazgo': 0,
        'Descarte': 0,
        'Pendiente': 0
    };

    filteredData.forEach(record => {
        // 1. Calculate Conformity Percentage
        let conformity = 0;
        if (record.calidadFruta && typeof record.calidadFruta.porcentajeConformes === 'number') {
            conformity = record.calidadFruta.porcentajeConformes;
        }
        totalConformitySum += conformity;

        // 2. Determine Status
        const status = determineBatchStatus(record);
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        if (status === 'Descarte') {
            rejectedCount++;
        }
    });

    const avgConformity = totalAudits > 0 ? (totalConformitySum / totalAudits).toFixed(1) : 0;

    // Charts Data
    // Sort by date ascending for the trend line
    const sortedForTrend = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const trendMapSorted = new Map();

    sortedForTrend.forEach(record => {
        const date = new Date(record.date);
        // Group by Day for more granularity
        const key = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        if (!trendMapSorted.has(key)) {
            trendMapSorted.set(key, { sum: 0, count: 0 });
        }

        let val = 0;
        if (record.calidadFruta && typeof record.calidadFruta.porcentajeConformes === 'number') {
            val = record.calidadFruta.porcentajeConformes;
        }

        const entry = trendMapSorted.get(key);
        entry.sum += val;
        entry.count++;
    });

    const finalTrendLabels = Array.from(trendMapSorted.keys());
    const finalTrendData = Array.from(trendMapSorted.values()).map(v => (v.sum / v.count).toFixed(1));

    // Breakdown Data
    const breakdownLabels = ['Descarte', 'Hallazgo', 'Conforme'];
    const breakdownValues = [
        statusCounts['Descarte'] || 0,
        statusCounts['Hallazgo'] || 0,
        statusCounts['Conforme'] || 0
    ];

    return {
        kpis: {
            conformidad: avgConformity,
            rechazados: rejectedCount,
            tiempo: "N/A",
            completadas: totalAudits
        },
        charts: {
            trend: {
                labels: finalTrendLabels,
                data: finalTrendData
            },
            breakdown: {
                labels: breakdownLabels,
                data: breakdownValues
            }
        }
    };
}

// ===============================================
// UI UPDATES
// ===============================================

function updateDashboard(processedData) {
    // Update KPIs
    document.getElementById('kpi-conformidad').textContent = `${processedData.kpis.conformidad}%`;
    document.getElementById('kpi-rechazados').textContent = processedData.kpis.rechazados;

    // Handle Time KPI
    const timeEl = document.getElementById('kpi-tiempo');
    if (processedData.kpis.tiempo === "N/A") {
        timeEl.textContent = "--";
        timeEl.nextElementSibling.textContent = "No disponible";
    } else {
        timeEl.textContent = processedData.kpis.tiempo;
    }

    document.getElementById('kpi-completadas').textContent = processedData.kpis.completadas;

    // Update Charts
    updateTrendChart(processedData.charts.trend);
    updateBreakdownChart(processedData.charts.breakdown);

    // Update Insights
    updateInsights(processedData.kpis);
}

function updateTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');

    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels.length > 0 ? data.labels : ['Sin datos'],
            datasets: [{
                label: 'Tasa de Conformidad (%)',
                data: data.data.length > 0 ? data.data : [0],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#4f46e5',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1f2937',
                    bodyColor: '#4b5563',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `Conformidad: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                    ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#6b7280' }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#6b7280' }
                }
            }
        }
    });
}

function updateBreakdownChart(data) {
    const ctx = document.getElementById('breakdownChart').getContext('2d');

    if (breakdownChartInstance) {
        breakdownChartInstance.destroy();
    }

    const hasData = data.data.some(val => val > 0);
    const chartData = hasData ? data.data : [1];
    const chartLabels = hasData ? data.labels : ['Sin datos'];
    const chartColors = hasData ? ['#ef4444', '#f59e0b', '#10b981'] : ['#e5e7eb'];

    breakdownChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: "'Inter', sans-serif", size: 12 },
                        color: '#4b5563'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#1f2937',
                    bodyColor: '#4b5563',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100) + '%';
                            return `${label}: ${value} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

function updateInsights(kpis) {
    // Insight 1: Conformity
    const conformityInsight = document.querySelector('.bg-green-50 p');
    if (conformityInsight) {
        if (kpis.completadas === 0) {
            conformityInsight.textContent = "No hay datos suficientes para generar insights. Por favor cargue un archivo.";
        } else {
            const conf = parseFloat(kpis.conformidad);
            if (conf > 90) {
                conformityInsight.textContent = `Excelente tasa de conformidad del ${kpis.conformidad}%. Mantener los estándares actuales.`;
            } else if (conf > 80) {
                conformityInsight.textContent = `Buena tasa de conformidad (${kpis.conformidad}%), pero hay margen de mejora.`;
            } else {
                conformityInsight.textContent = `Atención: La conformidad está en ${kpis.conformidad}%. Se requiere revisión.`;
            }
        }
    }

    // Insight 4: Volume
    const volumeInsight = document.querySelector('.bg-purple-50 p');
    if (volumeInsight) {
        if (kpis.completadas === 0) {
            volumeInsight.textContent = "Esperando carga de archivos para análisis de volumen.";
        } else {
            volumeInsight.textContent = `Se han procesado ${kpis.completadas} lotes en total basados en los archivos cargados.`;
        }
    }
}

// ===============================================
// INITIALIZATION
// ===============================================

document.addEventListener('DOMContentLoaded', async () => {
    const userIdDisplay = document.getElementById('user-id-display');
    const storedUserId = sessionStorage.getItem('trazanet_user_id');

    if (userIdDisplay) {
        userIdDisplay.textContent = storedUserId ? `ID: ${storedUserId}` : 'Usuario Invitado';
    }

    allHistoryData = await fetchHistoryData();
    const processedData = processData(allHistoryData, 'Global');
    updateDashboard(processedData);

    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const filter = e.target.value;
            const processedData = processData(allHistoryData, filter);
            updateDashboard(processedData);
        });
    }
});

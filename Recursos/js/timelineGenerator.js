/**
 * Timeline Generator Module for TrazaNet
 * Generates intelligent timeline events based on batch data
 */

const TimelineGenerator = {
    /**
     * Generates a complete timeline for a batch
     * @param {Object} batch - Batch data object
     * @returns {Array} Array of timeline events
     */
    generateTimeline(batch) {
        const events = [];
        const batchDate = new Date(batch.date);

        // 1. Harvest/Origin Event
        const harvestDate = this.estimateHarvestDate(batchDate);
        events.push({
            title: 'Cosecha Registrada',
            date: harvestDate,
            icon: 'fa-leaf',
            color: 'bg-green-500',
            desc: this.getOriginDescription(batch),
            category: 'origin',
            status: 'completed'
        });

        // 2. Quality Control at Origin
        const originQCDate = new Date(harvestDate.getTime() + 1000 * 60 * 60 * 4); // 4 hours after harvest
        events.push({
            title: 'Control de Calidad en Origen',
            date: originQCDate,
            icon: 'fa-check-circle',
            color: 'bg-emerald-500',
            desc: 'Inspección inicial de calidad y clasificación en campo.',
            category: 'quality',
            status: 'completed'
        });

        // 3. Transportation to Processing Center
        const transportDate = new Date(harvestDate.getTime() + 1000 * 60 * 60 * 8); // 8 hours after harvest
        events.push({
            title: 'Transporte Iniciado',
            date: transportDate,
            icon: 'fa-truck',
            color: 'bg-blue-500',
            desc: 'Transporte refrigerado hacia centro de procesamiento.',
            category: 'logistics',
            status: 'completed'
        });

        // 4. Reception at Processing Center
        const receptionDate = new Date(harvestDate.getTime() + 1000 * 60 * 60 * 24); // 1 day after harvest
        events.push({
            title: 'Recepción en Planta',
            date: receptionDate,
            icon: 'fa-truck-loading',
            color: 'bg-cyan-500',
            desc: 'Lote recibido en centro de distribución y almacenamiento.',
            category: 'logistics',
            status: 'completed'
        });

        // 5. Processing and Packaging
        const processingDate = new Date(receptionDate.getTime() + 1000 * 60 * 60 * 6); // 6 hours after reception
        events.push({
            title: 'Procesamiento y Empaque',
            date: processingDate,
            icon: 'fa-box',
            color: 'bg-purple-500',
            desc: 'Selección, limpieza, clasificación y empaque del lote.',
            category: 'processing',
            status: 'completed'
        });

        // 6. Data Upload Event
        events.push({
            title: 'Carga de Datos',
            date: batchDate,
            icon: 'fa-upload',
            color: 'bg-indigo-500',
            desc: `Archivo ${batch.fileName} cargado al sistema TrazaNet.`,
            category: 'system',
            status: 'completed'
        });

        // 7. Automated Analysis
        const analysisDate = new Date(batchDate.getTime() + 1000 * 60 * 2); // 2 mins after upload
        events.push({
            title: 'Análisis Automatizado',
            date: analysisDate,
            icon: 'fa-robot',
            color: 'bg-violet-500',
            desc: 'Procesamiento de datos y análisis de calidad mediante IA.',
            category: 'system',
            status: 'completed'
        });

        // 8. Audit Completed
        const auditDate = new Date(batchDate.getTime() + 1000 * 60 * 5); // 5 mins after upload
        const auditResult = batch.simResult || 'Pendiente';
        const auditColor = this.getAuditColor(auditResult);
        events.push({
            title: 'Auditoría Completada',
            date: auditDate,
            icon: 'fa-clipboard-check',
            color: auditColor,
            desc: `Resultado: ${auditResult}. ${this.getAuditDescription(batch)}`,
            category: 'audit',
            status: 'completed',
            highlight: true
        });

        // 9. Blockchain Registration (if applicable)
        if (batch.transactionId && batch.transactionId !== 'Pendiente') {
            const blockchainDate = new Date(auditDate.getTime() + 1000 * 60 * 3); // 3 mins after audit
            events.push({
                title: 'Registro en Blockchain',
                date: blockchainDate,
                icon: 'fa-link',
                color: 'bg-amber-500',
                desc: `Transacción registrada: ${batch.transactionId.substring(0, 16)}...`,
                category: 'blockchain',
                status: 'completed'
            });
        }

        // 10. Current Status / Next Steps
        const nextStepDate = new Date();
        const nextStep = this.getNextStep(batch);
        events.push({
            title: nextStep.title,
            date: nextStepDate,
            icon: nextStep.icon,
            color: nextStep.color,
            desc: nextStep.desc,
            category: 'next',
            status: 'pending'
        });

        // Sort events by date (most recent first)
        return events.sort((a, b) => b.date - a.date);
    },

    /**
     * Estimates harvest date based on upload date
     * @param {Date} uploadDate - Date when file was uploaded
     * @returns {Date} Estimated harvest date
     */
    estimateHarvestDate(uploadDate) {
        // Typically 2-3 days before upload
        const daysBeforeUpload = 2 + Math.random(); // 2-3 days
        return new Date(uploadDate.getTime() - daysBeforeUpload * 24 * 60 * 60 * 1000);
    },

    /**
     * Gets origin description based on batch data
     * @param {Object} batch - Batch data object
     * @returns {string} Origin description
     */
    getOriginDescription(batch) {
        const origins = [
            'Finca El Paraíso, Zona Cafetera',
            'Cooperativa Agrícola San José',
            'Hacienda Los Andes, Valle del Cauca',
            'Finca La Esperanza, Antioquia',
            'Productores Asociados del Norte'
        ];

        // Use batch ID to consistently select same origin for same batch
        const index = batch.id ? parseInt(batch.id.substring(0, 8), 16) % origins.length : 0;
        return `Origen verificado: ${origins[index]}`;
    },

    /**
     * Gets audit result color
     * @param {string} result - Audit result
     * @returns {string} Tailwind color class
     */
    getAuditColor(result) {
        switch (result) {
            case 'Conforme':
                return 'bg-green-500';
            case 'Hallazgo':
                return 'bg-yellow-500';
            case 'Descarte':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    },

    /**
     * Gets audit description based on batch quality
     * @param {Object} batch - Batch data object
     * @returns {string} Audit description
     */
    getAuditDescription(batch) {
        const result = batch.simResult;
        const calidadFruta = batch.calidadFruta;

        if (!calidadFruta) {
            return 'Análisis automático finalizado con éxito.';
        }

        const total = calidadFruta.total || 0;
        const noAdmitidas = calidadFruta.noAdmitidas || 0;
        const pctNoAdmitidas = total > 0 ? ((noAdmitidas / total) * 100).toFixed(1) : 0;

        switch (result) {
            case 'Conforme':
                return `Lote aprobado. Calidad dentro de parámetros aceptables.`;
            case 'Hallazgo':
                return `Se detectaron ${pctNoAdmitidas}% de defectos. Requiere atención pero es comercializable.`;
            case 'Descarte':
                return `Lote rechazado. ${pctNoAdmitidas}% de fruta no admitida excede límites.`;
            default:
                return 'Análisis en proceso.';
        }
    },

    /**
     * Determines next step based on batch status
     * @param {Object} batch - Batch data object
     * @returns {Object} Next step event
     */
    getNextStep(batch) {
        const result = batch.simResult;
        const calidadFruta = batch.calidadFruta;
        const qualityScore = calidadFruta && calidadFruta.total > 0
            ? ((calidadFruta.conformes / calidadFruta.total) * 100)
            : 0;

        if (result === 'Descarte') {
            return {
                title: 'Acción Requerida: Segregación',
                icon: 'fa-exclamation-triangle',
                color: 'bg-red-500',
                desc: 'Separar lote del inventario principal y evaluar opciones de recuperación o descarte.'
            };
        } else if (result === 'Hallazgo') {
            return {
                title: 'Próximo Paso: Monitoreo',
                icon: 'fa-eye',
                color: 'bg-yellow-500',
                desc: 'Monitorear evolución del lote durante almacenamiento. Priorizar comercialización.'
            };
        } else if (qualityScore >= 95) {
            return {
                title: 'Próximo Paso: Exportación Premium',
                icon: 'fa-plane-departure',
                color: 'bg-emerald-500',
                desc: 'Lote calificado para mercados premium. Coordinar exportación internacional.'
            };
        } else {
            return {
                title: 'Próximo Paso: Distribución',
                icon: 'fa-shipping-fast',
                color: 'bg-blue-500',
                desc: 'Lote listo para distribución a canales comerciales estándar.'
            };
        }
    },

    /**
     * Formats a timeline event for HTML rendering
     * @param {Object} event - Event object
     * @param {number} index - Event index
     * @returns {string} HTML string
     */
    formatEventHTML(event, index) {
        const isHighlight = event.highlight ? 'ring-2 ring-indigo-300' : '';
        const isPending = event.status === 'pending' ? 'opacity-75' : '';

        return `
            <div class="relative flex items-start z-10 ${isPending}">
                <div class="w-12 h-12 rounded-full ${event.color} border-4 border-white shadow-md flex items-center justify-center text-white shrink-0 ${isHighlight}">
                    <i class="fas ${event.icon} text-sm"></i>
                </div>
                <div class="ml-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex-1 ${isHighlight}">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-semibold text-slate-800">${event.title}</h4>
                        <span class="text-xs text-slate-400">${event.date.toLocaleDateString('es-ES')} ${event.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p class="text-sm text-slate-600">${event.desc}</p>
                    ${event.status === 'pending' ? '<span class="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pendiente</span>' : ''}
                </div>
            </div>
        `;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimelineGenerator;
}

/**
 * AI Analysis Module for TrazaNet
 * Provides intelligent analysis and insights for batch quality data
 */

const AIAnalysis = {
    /**
     * Performs comprehensive quality analysis on a batch
     * @param {Object} batch - Batch data object
     * @returns {Object} Analysis results
     */
    analyzeQuality(batch) {
        const calidadFruta = batch.calidadFruta || {};
        const total = calidadFruta.total || 0;
        const conformes = calidadFruta.conformes || 0;
        const hallazgosMenores = calidadFruta.hallazgosMenores || 0;
        const noAdmitidas = calidadFruta.noAdmitidas || 0;

        // Calculate percentages
        const conformesPct = total > 0 ? (conformes / total * 100) : 0;
        const hallazgosPct = total > 0 ? (hallazgosMenores / total * 100) : 0;
        const noAdmitidasPct = total > 0 ? (noAdmitidas / total * 100) : 0;

        // Quality score (0-100)
        const qualityScore = conformesPct;

        // Risk score (0-100, higher = more risk)
        const riskScore = (hallazgosPct * 0.5) + (noAdmitidasPct * 2);

        // Classification
        let classification = 'EXCELENTE';
        let classColor = 'green';
        if (qualityScore >= 95) {
            classification = 'PREMIUM';
            classColor = 'emerald';
        } else if (qualityScore >= 85) {
            classification = 'EXCELENTE';
            classColor = 'green';
        } else if (qualityScore >= 70) {
            classification = 'BUENO';
            classColor = 'yellow';
        } else if (qualityScore >= 50) {
            classification = 'ACEPTABLE';
            classColor = 'orange';
        } else {
            classification = 'RECHAZADO';
            classColor = 'red';
        }

        return {
            qualityScore: qualityScore.toFixed(1),
            riskScore: riskScore.toFixed(1),
            classification,
            classColor,
            conformesPct: conformesPct.toFixed(1),
            hallazgosPct: hallazgosPct.toFixed(1),
            noAdmitidasPct: noAdmitidasPct.toFixed(1),
            total,
            conformes,
            hallazgosMenores,
            noAdmitidas
        };
    },

    /**
     * Generates actionable insights based on batch data
     * @param {Object} batch - Batch data object
     * @returns {Array} Array of insight objects
     */
    generateInsights(batch) {
        const analysis = this.analyzeQuality(batch);
        const insights = [];
        const defectos = batch.calidadFruta?.defectos || [];

        // Quality-based insights
        if (parseFloat(analysis.qualityScore) >= 95) {
            insights.push({
                type: 'success',
                icon: '✨',
                title: 'Calidad Premium',
                message: 'Este lote alcanza estándares de exportación premium. Ideal para mercados internacionales exigentes.',
                priority: 'high'
            });
        } else if (parseFloat(analysis.qualityScore) >= 85) {
            insights.push({
                type: 'success',
                icon: '✅',
                title: 'Excelente Calidad',
                message: 'El lote cumple con los más altos estándares de calidad. Apto para todos los mercados.',
                priority: 'medium'
            });
        } else if (parseFloat(analysis.qualityScore) >= 70) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Calidad Aceptable',
                message: 'El lote es comercializable pero presenta defectos menores que requieren atención.',
                priority: 'medium'
            });
        } else {
            insights.push({
                type: 'danger',
                icon: '🚫',
                title: 'Riesgo Alto',
                message: 'La calidad del lote está por debajo de los estándares mínimos. Se recomienda segregación inmediata.',
                priority: 'critical'
            });
        }

        // Defect-specific insights
        if (parseFloat(analysis.noAdmitidasPct) > 10) {
            insights.push({
                type: 'danger',
                icon: '🔴',
                title: 'Alto Porcentaje de Fruta No Admitida',
                message: `${analysis.noAdmitidasPct}% de fruta no admitida excede límites aceptables. Revisar procesos de selección en origen.`,
                priority: 'critical'
            });
        } else if (parseFloat(analysis.noAdmitidasPct) > 5) {
            insights.push({
                type: 'warning',
                icon: '🟡',
                title: 'Fruta No Admitida Detectada',
                message: `Se detectó ${analysis.noAdmitidasPct}% de fruta no admitida. Monitorear tendencias en próximos lotes.`,
                priority: 'high'
            });
        }

        // Defect pattern analysis
        if (defectos.length > 0) {
            const topDefect = defectos.reduce((max, d) => d.cantidad > max.cantidad ? d : max, defectos[0]);
            if (topDefect.cantidad > analysis.total * 0.05) {
                insights.push({
                    type: 'info',
                    icon: '🔍',
                    title: 'Defecto Predominante Identificado',
                    message: `"${topDefect.nombre}" representa el ${topDefect.porcentaje}% del total. Implementar controles preventivos específicos.`,
                    priority: 'medium'
                });
            }
        }

        // Risk assessment
        if (parseFloat(analysis.riskScore) > 20) {
            insights.push({
                type: 'warning',
                icon: '⚡',
                title: 'Riesgo de Deterioro Elevado',
                message: 'El perfil de defectos sugiere riesgo de deterioro acelerado. Priorizar comercialización inmediata.',
                priority: 'high'
            });
        }

        return insights;
    },

    /**
     * Generates specific recommendations based on batch analysis
     * @param {Object} batch - Batch data object
     * @returns {Array} Array of recommendation objects
     */
    getRecommendations(batch) {
        const analysis = this.analyzeQuality(batch);
        const recommendations = [];
        const defectos = batch.calidadFruta?.defectos || [];

        // Quality-based recommendations
        if (parseFloat(analysis.qualityScore) >= 95) {
            recommendations.push({
                category: 'Comercialización',
                action: 'Destinar a mercados premium',
                impact: 'Alto',
                description: 'Este lote puede obtener precios superiores en mercados de exportación premium.'
            });
        } else if (parseFloat(analysis.qualityScore) >= 85) {
            recommendations.push({
                category: 'Comercialización',
                action: 'Exportación estándar',
                impact: 'Medio',
                description: 'Lote apto para exportación a mercados internacionales estándar.'
            });
        } else if (parseFloat(analysis.qualityScore) >= 70) {
            recommendations.push({
                category: 'Comercialización',
                action: 'Mercado nacional o procesamiento',
                impact: 'Medio',
                description: 'Considerar venta en mercado nacional o destinar a procesamiento industrial.'
            });
        } else {
            recommendations.push({
                category: 'Gestión de Riesgo',
                action: 'Segregar y evaluar pérdidas',
                impact: 'Crítico',
                description: 'Separar inmediatamente del inventario principal y evaluar opciones de recuperación.'
            });
        }

        // Storage recommendations
        if (parseFloat(analysis.noAdmitidasPct) > 5) {
            recommendations.push({
                category: 'Almacenamiento',
                action: 'Reducir tiempo de almacenamiento',
                impact: 'Alto',
                description: 'Minimizar periodo de almacenamiento para prevenir propagación de defectos.'
            });
        } else {
            recommendations.push({
                category: 'Almacenamiento',
                action: 'Almacenamiento estándar',
                impact: 'Bajo',
                description: 'Aplicar protocolos estándar de almacenamiento refrigerado.'
            });
        }

        // Process improvement recommendations
        const defectTypes = defectos.map(d => d.nombre.toLowerCase());

        if (defectTypes.some(d => d.includes('magulladura') || d.includes('golpe'))) {
            recommendations.push({
                category: 'Mejora de Procesos',
                action: 'Revisar manejo y transporte',
                impact: 'Medio',
                description: 'Implementar capacitación en manejo delicado y revisar cadena de transporte.'
            });
        }

        if (defectTypes.some(d => d.includes('plaga') || d.includes('insecto'))) {
            recommendations.push({
                category: 'Mejora de Procesos',
                action: 'Reforzar control de plagas',
                impact: 'Alto',
                description: 'Implementar programa de manejo integrado de plagas en origen.'
            });
        }

        if (defectTypes.some(d => d.includes('madurez') || d.includes('verde'))) {
            recommendations.push({
                category: 'Mejora de Procesos',
                action: 'Optimizar punto de cosecha',
                impact: 'Alto',
                description: 'Capacitar personal en identificación de punto óptimo de cosecha.'
            });
        }

        // Traceability recommendation
        recommendations.push({
            category: 'Trazabilidad',
            action: 'Registrar en blockchain',
            impact: 'Medio',
            description: 'Asegurar registro completo de auditoría en blockchain para trazabilidad inmutable.'
        });

        return recommendations;
    },

    /**
     * Predicts shelf life based on quality metrics
     * @param {Object} batch - Batch data object
     * @returns {Object} Shelf life prediction
     */
    predictShelfLife(batch) {
        const analysis = this.analyzeQuality(batch);
        const baseShelfLife = 14; // days (base for good quality fruit)

        // Adjust based on quality score
        let shelfLifeDays = baseShelfLife;
        const qualityScore = parseFloat(analysis.qualityScore);

        if (qualityScore >= 95) {
            shelfLifeDays = 21; // Premium quality
        } else if (qualityScore >= 85) {
            shelfLifeDays = 14; // Good quality
        } else if (qualityScore >= 70) {
            shelfLifeDays = 10; // Acceptable
        } else if (qualityScore >= 50) {
            shelfLifeDays = 5; // Poor quality
        } else {
            shelfLifeDays = 2; // Very poor quality
        }

        // Adjust for defects
        const noAdmitidasPct = parseFloat(analysis.noAdmitidasPct);
        if (noAdmitidasPct > 10) {
            shelfLifeDays = Math.max(2, shelfLifeDays - 7);
        } else if (noAdmitidasPct > 5) {
            shelfLifeDays = Math.max(3, shelfLifeDays - 4);
        }

        const today = new Date();
        const expiryDate = new Date(today.getTime() + shelfLifeDays * 24 * 60 * 60 * 1000);

        let urgency = 'normal';
        if (shelfLifeDays <= 3) {
            urgency = 'critical';
        } else if (shelfLifeDays <= 7) {
            urgency = 'high';
        } else if (shelfLifeDays <= 10) {
            urgency = 'medium';
        }

        return {
            days: shelfLifeDays,
            expiryDate: expiryDate.toLocaleDateString('es-ES'),
            urgency,
            confidence: qualityScore >= 70 ? 'Alta' : 'Media'
        };
    },

    /**
     * Calculates economic impact of quality issues
     * @param {Object} batch - Batch data object
     * @param {number} pricePerKg - Price per kg in local currency
     * @returns {Object} Economic impact analysis
     */
    calculateEconomicImpact(batch, pricePerKg = 2.5) {
        const analysis = this.analyzeQuality(batch);
        const avgWeightPerUnit = 0.15; // kg (average fruit weight)

        const totalKg = analysis.total * avgWeightPerUnit;
        const lostKg = analysis.noAdmitidas * avgWeightPerUnit;
        const affectedKg = analysis.hallazgosMenores * avgWeightPerUnit;

        const potentialValue = totalKg * pricePerKg;
        const directLoss = lostKg * pricePerKg;
        const indirectLoss = affectedKg * pricePerKg * 0.3; // 30% price reduction for affected
        const totalLoss = directLoss + indirectLoss;
        const recoveredValue = potentialValue - totalLoss;

        return {
            potentialValue: potentialValue.toFixed(2),
            directLoss: directLoss.toFixed(2),
            indirectLoss: indirectLoss.toFixed(2),
            totalLoss: totalLoss.toFixed(2),
            recoveredValue: recoveredValue.toFixed(2),
            lossPercentage: ((totalLoss / potentialValue) * 100).toFixed(1)
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAnalysis;
}

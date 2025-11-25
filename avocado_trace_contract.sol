// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AvocadoTraceContract
 * @notice Contrato central de TrazaNet para la gestión de umbrales de calidad,
 * registro de eventos de trazabilidad y ejecución de auditorías automatizadas.
 * Implementa la lógica de gobernanza (administracion_smart_contracts.html)
 * y el motor de validación (analisis_falla.html).
 */
contract AvocadoTraceContract {

    // =========================================================================
    // 1. VARIABLES DE ESTADO & UMBRALES CONFIGURABLES
    // Estos valores son modificables por el Administrador (owner) y rigen las reglas.
    // Usamos uint256 para evitar problemas de coma flotante, almacenando el valor multiplicado (x100).
    // Ej: 8.0 °C se almacena como 800.
    // =========================================================================
    address public owner; // Dirección del Administrador.
    
    // Parámetros de Calidad/Integridad (Modificables desde administracion_smart_contracts.html)
    uint256 public MAX_TEMP_TRANSPORT_C;     // Umbral de temperatura máxima (°C * 100).
    uint256 public MAX_WEIGHT_DEVIATION_PCT; // Desviación de peso máxima permitida (%).
    uint256 public MIN_DRY_MATTER_PCT;       // Materia seca mínima requerida (%).

    // =========================================================================
    // 2. ESTRUCTURAS DE DATOS DE TRAZABILIDAD
    // =========================================================================
    
    // Almacena el resultado final de la auditoría y la causa si falla.
    struct AuditResult {
        bool isCompliant;           // El lote cumple con todos los umbrales (true/false).
        string reason;              // Descripción del hallazgo o "Lote Conforme".
        uint256 timestamp;          // Momento en que se ejecutó la auditoría.
    }
    
    // Almacena datos clave del lote a lo largo de su ciclo de vida.
    struct BatchData {
        string loteId;
        string variety;
        address registeredBy;       // El usuario/wallet que registró el lote inicial (carga.html)
        uint256 initialWeight;      // Peso inicial registrado (carga.html)
        uint256 finalWeightReceived; // Peso en recepción (registro_procesamiento.html)
        uint256 avgTemperature;     // Temperatura promedio del viaje (registro_transporte.html)
        AuditResult audit;
    }

    // Mapeo para almacenar todos los datos de un lote usando su ID como clave.
    mapping(string => BatchData) public batches;


    // =========================================================================
    // 3. EVENTOS (Para comunicación off-chain)
    // =========================================================================
    // Ayudan a la interfaz web (gestor_alertas_blockchain.html) a reaccionar a los cambios.
    event ThresholdsUpdated(address indexed by, uint256 maxTemp, uint256 maxWeightDev, uint256 minDryMatter);
    event BatchRegistered(string indexed loteId, address indexed registrador);
    event BatchAuditCompleted(string indexed loteId, bool compliant, string reason);
    event AssetTransfer(string indexed loteId, address indexed from, address indexed to, uint256 amountUSD);


    // =========================================================================
    // 4. MODIFICADOR Y CONSTRUCTOR
    // =========================================================================
    
    // Modificador que restringe funciones solo al administrador del contrato.
    modifier onlyOwner() {
        require(msg.sender == owner, "Acceso denegado: Solo el administrador puede ejecutar esta funcion.");
        _;
    }

    /**
     * @notice Constructor del contrato. Se ejecuta una sola vez al desplegar.
     * @param initialMaxTemp Umbral de temperatura inicial (ej. 800).
     * @param initialMaxWeightDev Desviación de peso inicial (ej. 5).
     * @param initialMinDryMatter Materia seca inicial (ej. 21).
     */
    constructor(uint256 initialMaxTemp, uint256 initialMaxWeightDev, uint256 initialMinDryMatter) {
        owner = msg.sender;
        MAX_TEMP_TRANSPORT_C = initialMaxTemp;
        MAX_WEIGHT_DEVIATION_PCT = initialMaxWeightDev;
        MIN_DRY_MATTER_PCT = initialMinDryMatter;
    }


    // =========================================================================
    // 5. FUNCIONES DE REGISTRO DE EVENTOS (Interfaces de Operación)
    // =========================================================================
    
    /**
     * @notice Registra los datos iniciales de cosecha del lote. (Pantalla: carga.html)
     */
    function registerBatchInitialData(
        string memory loteId,
        string memory variety,
        uint256 initialWeight
    ) public {
        require(batches[loteId].timestamp == 0, "Lote ya registrado."); // Evita doble registro inicial

        batches[loteId] = BatchData({
            loteId: loteId,
            variety: variety,
            registeredBy: msg.sender,
            initialWeight: initialWeight,
            finalWeightReceived: 0, // Se actualizará después
            avgTemperature: 0,      // Se actualizará después
            audit: AuditResult(false, "Pendiente de Auditoria", block.timestamp)
        });

        emit BatchRegistered(loteId, msg.sender);
    }
    
    /**
     * @notice Registra los datos de transporte. (Pantalla: registro_transporte.html)
     */
    function updateTransportData(
        string memory loteId,
        uint256 avgTemperature
    ) public {
        require(batches[loteId].timestamp != 0, "Lote no encontrado.");
        batches[loteId].avgTemperature = avgTemperature;
        // La auditoría se disparará con la función 'evaluateBatch' después del procesamiento
    }

    /**
     * @notice Registra los datos de recepción y dispara la primera evaluación de peso. (Pantalla: registro_procesamiento.html)
     */
    function updateReceptionData(
        string memory loteId,
        uint256 finalWeightReceived
    ) public {
        require(batches[loteId].timestamp != 0, "Lote no encontrado.");
        batches[loteId].finalWeightReceived = finalWeightReceived;
        
        // Ejecutar auditoría inicial (Temperatura y Desviación de Peso)
        evaluateBatch(loteId, 0, finalWeightReceived, 0); 
    }
    
    // =========================================================================
    // 6. FUNCIÓN DE GOBERNANZA (Interfaz: administracion_smart_contracts.html)
    // =========================================================================
    
    /**
     * @notice Permite al administrador actualizar todos los parámetros clave.
     * Esta es la función que se llama al pulsar "Actualizar Parámetros en Blockchain".
     */
    function setThresholds(
        uint256 newMaxTemp, 
        uint256 newMaxWeightDev, 
        uint256 newMinDryMatter
    ) public onlyOwner {
        MAX_TEMP_TRANSPORT_C = newMaxTemp;
        MAX_WEIGHT_DEVIATION_PCT = newMaxWeightDev;
        MIN_DRY_MATTER_PCT = newMinDryMatter;

        emit ThresholdsUpdated(msg.sender, newMaxTemp, newMaxWeightDev, newMinDryMatter);
    }
    
    // =========================================================================
    // 7. FUNCIÓN CENTRAL DE AUDITORÍA (Motor de Reglas)
    // =========================================================================

    /**
     * @notice Ejecuta la auditoría del lote contra todos los umbrales establecidos en el contrato.
     * Simula la lógica detrás de analisis_falla.html.
     */
    function evaluateBatch(
        string memory loteId,
        uint256 avgTemperatureC_Input, // Requerido para la auditoría de transporte
        uint256 finalWeightReceived_Input, // Requerido para la auditoría de peso
        uint256 finalDryMatterPct_Input // Requerido para la auditoría de empaque (registro_empaque.html)
    ) public {
        
        BatchData storage batch = batches[loteId];
        bool compliant = true;
        string memory reason = "Lote Conforme. Cumple con todos los SC.";

        // Usar datos almacenados si no se proporcionan explícitamente (para auditorías parciales)
        uint256 avgTemp = (avgTemperatureC_Input != 0) ? avgTemperatureC_Input : batch.avgTemperature;
        uint256 initialWeight = batch.initialWeight;
        uint256 finalWeight = (finalWeightReceived_Input != 0) ? finalWeightReceived_Input : batch.finalWeightReceived;

        // -----------------------------------------------------------
        // AUDITORÍA 1: TEMPERATURA (Desde registro_transporte.html)
        // -----------------------------------------------------------
        if (avgTemp > MAX_TEMP_TRANSPORT_C) {
            compliant = false;
            reason = "FALLA: Temperatura promedio excedida. Umbral MAX: " ;
            // El resto del string se concatenaría en el front-end por simplicidad en Solidity.
        }

        // -----------------------------------------------------------
        // AUDITORÍA 2: DESVIACIÓN DE PESO (Desde registro_procesamiento.html)
        // -----------------------------------------------------------
        uint256 weightDeviation;
        if (initialWeight > 0 && finalWeight > 0) {
            // weightDeviation = abs(initialWeight - finalWeight) * 100 / initialWeight
            // Dado que Solidity no maneja floats fácilmente, usamos enteros y multiplicamos/dividimos.
            
            // Simulación de desviación absoluta
            uint256 difference;
            if (initialWeight > finalWeight) {
                difference = initialWeight - finalWeight;
            } else {
                difference = finalWeight - initialWeight;
            }
            
            // Cálculo de porcentaje de desviación (difference * 100 / initialWeight)
            weightDeviation = (difference * 100 * 100) / initialWeight; // x100 para mantener precisión
            
            if (compliant && weightDeviation > (MAX_WEIGHT_DEVIATION_PCT * 100)) { // Comparar con umbral (tambien x100)
                compliant = false;
                reason = "FALLA: Desviación de peso entre etapas excedida. Lote rechazado.";
            }
        }
        
        // -----------------------------------------------------------
        // AUDITORÍA 3: MATERIA SECA FINAL (Desde registro_empaque.html)
        // -----------------------------------------------------------
        if (compliant && finalDryMatterPct_Input > 0 && finalDryMatterPct_Input < MIN_DRY_MATTER_PCT) {
            compliant = false;
            reason = "FALLA: Materia seca final insuficiente. No apto para exportación.";
        }

        // Actualizar el estado del lote en la Blockchain
        batch.audit = AuditResult(compliant, reason, block.timestamp);

        // Emitir evento
        emit BatchAuditCompleted(loteId, compliant, reason);
    }
    
    // =========================================================================
    // 8. FUNCIÓN DE TRANSACCIÓN DE PROPIEDAD (Interfaz: transaccion_lote.html)
    // =========================================================================
    
    /**
     * @notice Simula la transferencia de propiedad del activo digital (NFT/Lote) y el registro del valor.
     * Esta función es fundamental para la pantalla transaccion_lote.html.
     */
    function transferAsset(
        string memory loteId, 
        address newOwner,
        uint256 amountUSD
    ) public {
        require(batches[loteId].timestamp != 0, "Lote no encontrado.");
        
        // Lógica de transferencia simulada: 
        // En un contrato NFT real, se llamaría a 'transferFrom(msg.sender, newOwner, tokenId)'

        // 1. Simular cambio de 'propietario' o registro de la transferencia.
        // Aquí solo registramos el evento para la trazabilidad financiera.

        // 2. Emitir el evento de transferencia financiera/propiedad.
        emit AssetTransfer(loteId, msg.sender, newOwner, amountUSD);
        
        // Nota: En un sistema real de pagos, el 'amountUSD' sería el valor en tokens/criptomonedas.
    }
}
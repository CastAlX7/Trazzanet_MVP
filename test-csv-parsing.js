const fs = require('fs');
const path = require('path');

// Leer el archivo CSV de ejemplo
const csvPath = path.join(__dirname, 'Lotes', 'LOTE_ID,FECHA_COSECHA,VARIEDAD,FINC.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

console.log('=== CONTENIDO DEL CSV ===');
console.log(csvContent);
console.log('\n=== ANÁLISIS ===');

const lines = csvContent.split('\n').filter(line => line.trim() !== '');
console.log(`Total de líneas (incluyendo encabezado): ${lines.length}`);
console.log(`Total de datos (sin encabezado): ${lines.length - 1}`);

if (lines.length > 1) {
    const headers = lines[0].split(',').map(h => h.trim());
    console.log(`\nEncabezados: ${headers.join(', ')}`);

    const statusIndex = headers.findIndex(h => h.toUpperCase() === 'CALIDAD_STATUS');
    console.log(`Índice de CALIDAD_STATUS: ${statusIndex}`);

    let totalFrutas = 0;
    let frutasConformes = 0;
    let frutasConHallazgos = 0;
    let frutasNoAdmitidas = 0;

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= headers.length) {
            totalFrutas++;
            const status = statusIndex >= 0 ? values[statusIndex].trim().toUpperCase() : 'OK';

            console.log(`Fila ${i}: Status = "${status}"`);

            if (status === 'OK') {
                frutasConformes++;
            } else if (status === 'ALERTA' || status === 'HALLAZGO') {
                frutasConHallazgos++;
            } else if (status === 'DESCARTE' || status === 'NO_ADMITIDA') {
                frutasNoAdmitidas++;
            } else {
                frutasConformes++;
            }
        }
    }

    console.log(`\n=== RESULTADOS ===`);
    console.log(`Total de frutas: ${totalFrutas}`);
    console.log(`Conformes: ${frutasConformes} (${(frutasConformes / totalFrutas * 100).toFixed(2)}%)`);
    console.log(`Con Hallazgos/Alerta: ${frutasConHallazgos} (${(frutasConHallazgos / totalFrutas * 100).toFixed(2)}%)`);
    console.log(`No Admitidas: ${frutasNoAdmitidas} (${(frutasNoAdmitidas / totalFrutas * 100).toFixed(2)}%)`);
}

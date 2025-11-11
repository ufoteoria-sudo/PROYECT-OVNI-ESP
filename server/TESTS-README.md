# Tests del Sistema UAP v4.0

## Ejecutar Tests

### Test Suite Completo
```bash
cd server
node test-suite.js
```

Genera reporte en `test-report.json` con métricas:
- Accuracy (% correctos)
- Confianza promedio
- Tiempo de procesamiento
- Detección de manipulación
- Detección de imágenes AI

### Test Individual (Imagen UFO)
```bash
node test-visual-analysis.js
```

Muestra análisis detallado:
- Análisis visual (objeto, color, cielo)
- Top 3 matches con scores
- Verificación categoría correcta

### Debug de Imagen (Píxeles)
```bash
node debug-image.js
```

Muestra información de bajo nivel:
- Primeros 10 píxeles RGB
- Color promedio
- Brillo del centro vs general

## Añadir Más Tests

Editar `test-suite.js` línea 14:

```javascript
const testDataset = [
  {
    file: 'imagen.jpg',
    expectedCategory: ['aircraft', 'drone'],      // Cualquiera de estos OK
    expectedNotCategory: ['uap', 'celestial'],    // NO debe ser estos
    description: 'Descripción del test'
  }
];
```

Copiar imagen a `uploads/images/` antes de ejecutar.

## Resultado Esperado

```
🎯 ACCURACY TOTAL: 100%
```

Imagen UFO de IA:
- ✅ Categoría: unknown (15%)
- ✅ NO coincide con aircraft
- ✅ Manipulación detectada (score 65)

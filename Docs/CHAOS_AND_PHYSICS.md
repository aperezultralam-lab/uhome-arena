# Chaos Physics + superficies UHome

## Objetivo
La destrucción debe comunicar el tipo de producto, no producir fragmentos aleatorios idénticos.

## Lambrín WPC
1. Importar el panel o muro modular.
2. Convertirlo a Geometry Collection.
3. Fracturar siguiendo franjas verticales alineadas con el lambrín.
4. Crear clusters por panel.
5. Mantener anchors en puntos de fijación.
6. Usar `AMCDestructibleSurface` como actor base.
7. Ajustar `BreakThreshold` entre 45–75 de daño para pruebas.

Resultado buscado: desprendimiento de listones y clusters longitudinales.

## Lámina PVC Ultralam
1. Dividir previamente el mesh respetando el patrón de la lámina.
2. Geometry Collection con piezas más grandes y delgadas.
3. Clusters por segmento.
4. Menor masa visual que WPC.
5. Threshold preliminar 35–55.

Resultado buscado: paneles que se desprenden y deforman visualmente, no bloques de concreto.

## Chaos Fields
`AMCDestructibleSurface` aplica:
- `Chaos_ExternalClusterStrain` para romper clusters.
- `Chaos_LinearVelocity` para separar fragmentos desde el impacto.

Los valores incluidos son de gameplay y deben balancearse con las Geometry Collections reales.

## Physical Materials de gameplay

| Material | Fricción inicial | Restitución | Uso |
|---|---:|---:|---|
| PM_SPC | 0.12 | 0.02 | slide largo |
| PM_MarbleSPC | 0.18 | 0.02 | slide medio/largo |
| PM_WPCDeck | 0.32 | 0.03 | control medio |
| PM_UltralamPVC | 0.40 | 0.04 | cobertura |
| PM_LambrinWPC | 0.55 | 0.03 | muro/cobertura |
| PM_PiedraPU | 0.70 | 0.02 | superficie de alto agarre |

> Estos valores son parámetros de videojuego, no coeficientes físicos certificados de los productos.

## SPC y movimiento
Para que el piso SPC tenga valor jugable:
- mantener `SlideGroundFriction` bajo;
- leer el Physical Material bajo el personaje;
- multiplicar desaceleración de slide según SurfaceType;
- aplicar el menor damping sobre `SurfaceType1 = SPC`.

Eso permite que una ruta del mapa tenga ventaja de movilidad sin convertir todos los pisos en hielo.

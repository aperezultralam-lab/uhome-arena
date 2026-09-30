# Pipeline PBR 4K — catálogo UHome

## Conjunto mínimo por acabado
- BaseColor / Albedo: 4096×4096, sRGB.
- Normal: 4096×4096, Linear.
- ORM: 4096×4096, Linear.
  - R = Ambient Occlusion
  - G = Roughness
  - B = Metallic
- Height: opcional, 16-bit cuando sea útil para authoring.

## Acabados objetivo
- Madera Nogal
- Parota
- Pino
- Roble
- Rosa
- Mármol SPC
- Piedra PU

## Captura / authoring
1. Fotografiar muestra plana con iluminación difusa y carta de color.
2. Corregir perspectiva y balance de blancos.
3. Crear tile seamless sin borrar rasgos característicos.
4. Derivar micro-normal desde escaneo/fotogrametría o herramienta de materiales.
5. Crear Roughness observando brillo real bajo luz rasante.
6. Evitar hornear sombras direccionales en BaseColor.
7. Validar escala física dentro de UE.

## Master Material
Crear `M_UHome_Master` con:
- Texture2D BaseColor
- Texture2D Normal
- Texture2D ORM
- Scalar `UVScale`
- Scalar `RoughnessMultiplier`
- Scalar `NormalStrength`
- Vector `Tint`
- Scalar `MacroVariation`
- Static Switch `UseDetailNormal`
- Static Switch `UseClearCoat`
- Static Switch `UseTriplanar`

## Instancias sugeridas
```text
MI_SPC_Nogal
MI_Lambrin_Parota
MI_Lambrin_Pino
MI_Lambrin_Roble
MI_Lambrin_Rosa
MI_SPC_Marmol
MI_PiedraPU
MI_Ultralam_Blanco
```

## Geometría vs normal map
- Lambrín: listones/peraltes importantes = geometría real + Nanite.
- Piedra PU: relieve grande = geometría real + Nanite.
- Mármol/SPC: superficie mayormente plana = normal microdetalle.
- Ultralam: perfil/acanalado = geometría real; microtextura en normal.

## Calidad
Para el target visual alto:
- Nanite en entorno y coberturas no esqueléticas.
- Lumen GI/reflections.
- Virtual Shadow Maps.
- TSR en preset alto.
- Texturas 4K sólo donde la densidad de texel lo justifique.

# UHome: Material Combat

Starter técnico para Unreal Engine 5.4+ creado en la rama `ue5-material-combat`.

## Estado
Incluye:
- Character Controller FPS.
- sprint;
- slide;
- bunny-hop assist;
- doble salto;
- sistema de arma hitscan server-authoritative;
- salud y respawn;
- sistema de coberturas server-authoritative;
- Lambrín WPC / Ultralam como deployables;
- actor Chaos destructible;
- configuración inicial de Lumen/Nanite/VSM;
- surface types;
- pipeline PBR 4K;
- roadmap MVP.

## Abrir
1. Instalar Unreal Engine 5.4.
2. Abrir `MaterialCombat.uproject`.
3. Aceptar recompilación del módulo C++.
4. Crear `Content/MaterialCombat/Maps/L_Showroom_CDMX`.
5. Crear BP derivados para personaje, coberturas y destructibles.
6. Asignar meshes, Geometry Collections, materiales y FX.

## Importante
Los archivos `.uasset` de mapas, Blueprints, Geometry Collections, Material Instances, meshes, texturas, animaciones y audio se crean/importan desde Unreal Editor y por eso no pueden generarse como C++ puro en el repositorio.

La rama conserva el juego web existente en `main`; el prototipo UE5 está aislado para no romper la versión publicada en Render.

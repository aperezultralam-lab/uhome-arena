# Roadmap — Playable MVP en 4 semanas

## Alcance de la demo
Mapa: **Showroom CDMX** en versión greybox hasta recibir plano/fotografías/dimensiones reales.

Gameplay:
- Deathmatch.
- 8–12 jugadores objetivo para pruebas.
- 1 arma: SPC Carbine.
- 2 coberturas: Lambrín WPC + Ultralam PVC.
- Sprint, bunny hop, doble salto y slide.
- TTK rápido.
- Respawn.
- marcador K/D.

## Semana 1 — Movimiento + red + mapa
**Día 1–2**
- abrir proyecto UE5.4;
- compilar módulo C++;
- crear BP_MCCharacter derivado de AMCCharacter;
- configurar Enhanced Input o conservar bindings legacy del starter.

**Día 3**
- tuning de sprint/slide/double jump;
- prueba PIE listen server con 2–4 clientes.

**Día 4–5**
- greybox L_Showroom_CDMX;
- rutas de flank;
- alturas para double jump;
- zonas SPC dedicadas a movilidad.

**Definition of Done**
Dos clientes pueden moverse simultáneamente con el loop de movimiento completo.

## Semana 2 — Gunplay
- mesh placeholder SPC Carbine;
- muzzle socket;
- recoil;
- hitscan;
- daño server authoritative;
- health/respawn;
- HUD ammo/HP;
- kill feed;
- scoreboard;
- audio provisional.

**DoD**
Partida Deathmatch completa con 1 arma.

## Semana 3 — UHome + Chaos
- crear M_UHome_Master;
- importar 3–4 acabados 4K prioritarios;
- BP_LambrinCover;
- BP_UltralamCover;
- Geometry Collections;
- Chaos fracture;
- Physical Materials;
- balance de placement y health.

**DoD**
Coberturas pueden colocarse, bloquear fuego y romperse de forma diferenciada.

## Semana 4 — Visual + optimización
- sustituir greybox visible por kit modular;
- Nanite;
- Lumen;
- VSM;
- decals e impactos;
- partículas Niagara;
- audio final MVP;
- pass de iluminación;
- profiling CPU/GPU;
- network profiling;
- build Windows;
- prueba 8–12 jugadores.

**DoD**
Build distribuible de la demo con sesión competitiva completa.

## Fuera del MVP
- matchmaking real;
- backend de cuentas;
- cosméticos;
- battle pass;
- anti-cheat dedicado;
- lag compensation avanzada;
- dedicated servers escalables;
- varios mapas;
- varias armas;
- Pixel Streaming/WebGPU.

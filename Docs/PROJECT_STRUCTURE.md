# UHome: Material Combat — Arquitectura UE5.4+

## Rama
`ue5-material-combat`

## Código
```text
Source/MaterialCombat/
├── Public/
│   ├── MCCharacter.h
│   ├── MCMovementComponent.h
│   ├── MCWeaponComponent.h
│   ├── MCDeployableComponent.h
│   ├── MCDeployableCover.h
│   ├── MCDestructibleSurface.h
│   └── MCGameMode.h
└── Private/
    ├── MCCharacter.cpp
    ├── MCMovementComponent.cpp
    ├── MCWeaponComponent.cpp
    ├── MCDeployableComponent.cpp
    ├── MCDeployableCover.cpp
    ├── MCDestructibleSurface.cpp
    └── MCGameMode.cpp
```

## Content esperado
```text
Content/MaterialCombat/
├── Blueprints/
│   ├── Characters/
│   ├── Weapons/
│   ├── Deployables/
│   └── GameModes/
├── Maps/
│   └── L_Showroom_CDMX.umap
├── Materials/
│   ├── Master/
│   ├── Instances/
│   └── PhysicalMaterials/
├── Textures/
│   ├── SPC/
│   ├── Lambrin/
│   ├── PiedraPU/
│   ├── Marmol/
│   └── Ultralam/
├── Meshes/
├── Chaos/
│   ├── GeometryCollections/
│   └── Fracture/
├── UI/
├── FX/
└── Audio/
```

## Responsabilidades
- **AMCCharacter**: pawn FPS, cámara, salud, input, doble salto y acceso a combate/deployables.
- **UMCMovementComponent**: sprint, slide, conservación de momentum y control aéreo.
- **UMCWeaponComponent**: hitscan server-authoritative, munición, fire rate, recarga y daño.
- **UMCDeployableComponent**: placement validado por servidor.
- **AMCDeployableCover**: cobertura con salud replicada.
- **AMCDestructibleSurface**: integración de Geometry Collection + Chaos Fields.
- **AMCGameMode**: respawn del MVP.

## Networking
La autoridad de daño y placement vive en servidor. Para producción, el siguiente paso es implementar predicción específica de sprint/slide con `FSavedMove_Character`, lag compensation y rewind de hitscan.

#include "MCDestructibleSurface.h"

#include "Field/FieldSystemComponent.h"
#include "Field/FieldSystemObjects.h"
#include "GeometryCollection/GeometryCollectionComponent.h"

AMCDestructibleSurface::AMCDestructibleSurface()
{
    GeometryCollection = CreateDefaultSubobject<UGeometryCollectionComponent>(TEXT("GeometryCollection"));
    SetRootComponent(GeometryCollection);

    GeometryCollection->SetCollisionProfileName(TEXT("BlockAll"));

    FieldSystem = CreateDefaultSubobject<UFieldSystemComponent>(TEXT("FieldSystem"));\n    FieldSystem->SetupAttachment(GeometryCollection);

    bReplicates = true;
    SetReplicateMovement(false);
}

float AMCDestructibleSurface::TakeDamage(
    float DamageAmount,
    FDamageEvent const& DamageEvent,
    AController* EventInstigator,
    AActor* DamageCauser)
{
    const float Applied = Super::TakeDamage(
        DamageAmount,
        DamageEvent,
        EventInstigator,
        DamageCauser);

    if (!HasAuthority() || Applied < BreakThreshold)
    {
        return Applied;
    }

    FVector ImpactPoint = GetActorLocation();

    if (DamageEvent.IsOfType(FPointDamageEvent::ClassID))
    {
        const FPointDamageEvent* PointEvent =
            static_cast<const FPointDamageEvent*>(&DamageEvent);

        ImpactPoint = PointEvent->HitInfo.ImpactPoint;
    }

    ApplyImpactField(ImpactPoint);
    return Applied;
}

void AMCDestructibleSurface::ApplyImpactField(const FVector& WorldPosition)
{
    if (!GeometryCollection)
    {
        return;
    }

    URadialFalloff* Strain = NewObject<URadialFalloff>(this);
    Strain->SetRadialFalloff(
        StrainMagnitude,
        0.f,
        1.f,
        0.f,
        FieldRadius,
        WorldPosition,
        EFieldFalloffType::Field_FallOff_None);

    GeometryCollection->ApplyPhysicsField(
        true,
        EGeometryCollectionPhysicsTypeEnum::Chaos_ExternalClusterStrain,
        nullptr,
        Strain);

    URadialVector* VelocityField = NewObject<URadialVector>(this);
    VelocityField->SetRadialVector(ImpulseMagnitude, WorldPosition);

    GeometryCollection->ApplyPhysicsField(
        true,
        EGeometryCollectionPhysicsTypeEnum::Chaos_LinearVelocity,
        nullptr,
        VelocityField);
}

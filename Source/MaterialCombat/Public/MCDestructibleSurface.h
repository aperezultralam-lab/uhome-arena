#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MCDestructibleSurface.generated.h"

class UGeometryCollectionComponent;
class UFieldSystemComponent;

UCLASS()
class MATERIALCOMBAT_API AMCDestructibleSurface : public AActor
{
    GENERATED_BODY()

public:
    AMCDestructibleSurface();

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UGeometryCollectionComponent> GeometryCollection;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UFieldSystemComponent> FieldSystem;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Destruction")
    float BreakThreshold = 55.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Destruction")
    float FieldRadius = 90.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Destruction")
    float StrainMagnitude = 500000.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Destruction")
    float ImpulseMagnitude = 700.f;

    virtual float TakeDamage(
        float DamageAmount,
        struct FDamageEvent const& DamageEvent,
        AController* EventInstigator,
        AActor* DamageCauser) override;

protected:
    void ApplyImpactField(const FVector& WorldPosition);
};

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MCDeployableCover.generated.h"

class UStaticMeshComponent;

UCLASS()
class MATERIALCOMBAT_API AMCDeployableCover : public AActor
{
    GENERATED_BODY()

public:
    AMCDeployableCover();

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UStaticMeshComponent> Mesh;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Deployable")
    float MaxHealth = 300.f;

    UPROPERTY(ReplicatedUsing=OnRep_Health, BlueprintReadOnly, Category="Deployable")
    float Health = 300.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Deployable")
    FName ProductId = TEXT("WPC_Lambrin");

    virtual float TakeDamage(
        float DamageAmount,
        struct FDamageEvent const& DamageEvent,
        AController* EventInstigator,
        AActor* DamageCauser) override;

protected:
    virtual void BeginPlay() override;
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION()
    void OnRep_Health();

    UFUNCTION(BlueprintImplementableEvent, Category="Deployable")
    void BP_OnHealthChanged(float NewHealth, float InMaxHealth);
};

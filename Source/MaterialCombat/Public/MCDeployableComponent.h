#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "MCDeployableComponent.generated.h"

class AMCDeployableCover;

UENUM(BlueprintType)
enum class EMCDeployableType : uint8
{
    LambrinWPC,
    UltralamPVC
};

UCLASS(ClassGroup=(Combat), meta=(BlueprintSpawnableComponent))
class MATERIALCOMBAT_API UMCDeployableComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UMCDeployableComponent();

    UPROPERTY(EditDefaultsOnly, Category="Deployable")
    TSubclassOf<AMCDeployableCover> LambrinCoverClass;

    UPROPERTY(EditDefaultsOnly, Category="Deployable")
    TSubclassOf<AMCDeployableCover> UltralamCoverClass;

    UPROPERTY(EditAnywhere, Category="Deployable")
    float MaxDeployDistance = 850.f;

    UPROPERTY(EditAnywhere, Category="Deployable")
    int32 MaxActiveDeployables = 2;

    UFUNCTION(BlueprintCallable)
    void RequestDeploy(EMCDeployableType Type);

protected:
    UFUNCTION(Server, Reliable)
    void ServerDeploy(
        EMCDeployableType Type,
        FVector_NetQuantize Location,
        FRotator Rotation);

private:
    TArray<TWeakObjectPtr<AMCDeployableCover>> ActiveDeployables;

    void RemoveInvalidDeployables();
};

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "MCWeaponComponent.generated.h"

UCLASS(ClassGroup=(Combat), meta=(BlueprintSpawnableComponent))
class MATERIALCOMBAT_API UMCWeaponComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UMCWeaponComponent();

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Weapon")
    float Damage = 26.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Weapon")
    float HeadshotMultiplier = 1.6f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Weapon")
    float FireInterval = 0.095f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Weapon")
    float Range = 7500.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Weapon")
    int32 MagazineSize = 28;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="Weapon")
    float ReloadDuration = 1.35f;

    UPROPERTY(ReplicatedUsing=OnRep_Ammo, BlueprintReadOnly, Category="Weapon")
    int32 Ammo = 28;

    UFUNCTION(BlueprintCallable)
    void StartFire();

    UFUNCTION(BlueprintCallable)
    void StopFire();

    UFUNCTION(BlueprintCallable)
    void Reload();

protected:
    virtual void BeginPlay() override;
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION(Server, Reliable)
    void ServerFire(FVector_NetQuantize TraceStart, FVector_NetQuantizeNormal ShotDirection);

    UFUNCTION(NetMulticast, Unreliable)
    void MulticastFireFX(FVector_NetQuantize TraceStart, FVector_NetQuantize TraceEnd);

    UFUNCTION(Server, Reliable)
    void ServerReload();

    UFUNCTION()
    void OnRep_Ammo();

private:
    FTimerHandle FireTimer;
    FTimerHandle ReloadTimer;
    double LastServerShotTime = -1000.0;

    void FireOnce();
    void FinishReload();
};

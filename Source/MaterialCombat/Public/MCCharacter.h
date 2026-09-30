#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "MCCharacter.generated.h"

class UCameraComponent;
class UMCWeaponComponent;
class UMCDeployableComponent;

UCLASS()
class MATERIALCOMBAT_API AMCCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AMCCharacter(const FObjectInitializer& ObjectInitializer);

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Camera")
    TObjectPtr<UCameraComponent> FirstPersonCamera;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Combat")
    TObjectPtr<UMCWeaponComponent> WeaponComponent;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category="Combat")
    TObjectPtr<UMCDeployableComponent> DeployableComponent;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category="Health")
    float MaxHealth = 100.f;

    UPROPERTY(ReplicatedUsing=OnRep_Health, BlueprintReadOnly, Category="Health")
    float Health = 100.f;

    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

    virtual float TakeDamage(
        float DamageAmount,
        struct FDamageEvent const& DamageEvent,
        AController* EventInstigator,
        AActor* DamageCauser) override;

protected:
    virtual void BeginPlay() override;
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    void MoveForward(float Value);
    void MoveRight(float Value);
    void StartSprint();
    void StopSprint();
    void StartSlide();
    void StopSlide();
    void HandleJump();
    void FirePressed();
    void FireReleased();
    void ReloadPressed();
    void DeployPrimary();

    UFUNCTION()
    void OnRep_Health();

    UFUNCTION(BlueprintImplementableEvent, Category="Health")
    void BP_OnHealthChanged(float NewHealth, float InMaxHealth);

private:
    void Die(AController* Killer);
};

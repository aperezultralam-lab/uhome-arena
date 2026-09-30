#pragma once

#include "CoreMinimal.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "MCMovementComponent.generated.h"

UENUM(BlueprintType)
enum class EMCMoveMode : uint8
{
    Slide UMETA(DisplayName="Slide")
};

UCLASS()
class MATERIALCOMBAT_API UMCMovementComponent : public UCharacterMovementComponent
{
    GENERATED_BODY()

public:
    UMCMovementComponent();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Movement|Sprint")
    float SprintMultiplier = 1.42f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Movement|Slide")
    float SlideEnterSpeed = 720.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Movement|Slide")
    float SlideInitialImpulse = 240.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Movement|Slide")
    float SlideGroundFriction = 0.45f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Movement|Slide")
    float SlideBrakingDeceleration = 330.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Movement|Air")
    float BunnyHopBoost = 70.f;

    UFUNCTION(BlueprintCallable)
    void SetSprinting(bool bEnabled);

    UFUNCTION(BlueprintCallable)
    void StartSlide();

    UFUNCTION(BlueprintCallable)
    void StopSlide();

    UFUNCTION(BlueprintPure)
    bool IsSliding() const;

    virtual float GetMaxSpeed() const override;
    virtual void PhysCustom(float DeltaTime, int32 Iterations) override;

private:
    bool bWantsSprint = false;

    void PhysSlide(float DeltaTime, int32 Iterations);
};

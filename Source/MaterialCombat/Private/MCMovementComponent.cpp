#include "MCMovementComponent.h"
#include "GameFramework/Character.h"

UMCMovementComponent::UMCMovementComponent()
{
    MaxWalkSpeed = 650.f;
    MaxAcceleration = 5200.f;
    BrakingDecelerationWalking = 1800.f;
    GroundFriction = 5.5f;
    AirControl = 0.82f;
    AirControlBoostMultiplier = 1.35f;
    AirControlBoostVelocityThreshold = 500.f;
    JumpZVelocity = 720.f;
}

void UMCMovementComponent::SetSprinting(bool bEnabled)
{
    bWantsSprint = bEnabled;
}

float UMCMovementComponent::GetMaxSpeed() const
{
    const float Base = Super::GetMaxSpeed();
    if (IsSliding())
    {
        return FMath::Max(Base * 1.55f, Velocity.Size2D());
    }
    return bWantsSprint ? Base * SprintMultiplier : Base;
}

bool UMCMovementComponent::IsSliding() const
{
    return MovementMode == MOVE_Custom &&
           CustomMovementMode == static_cast<uint8>(EMCMoveMode::Slide);
}

void UMCMovementComponent::StartSlide()
{
    if (!CharacterOwner || !IsMovingOnGround() || Velocity.Size2D() < SlideEnterSpeed)
    {
        return;
    }

    CharacterOwner->Crouch();

    FVector Forward = Velocity.GetSafeNormal2D();
    Velocity += Forward * SlideInitialImpulse;

    SetMovementMode(MOVE_Custom, static_cast<uint8>(EMCMoveMode::Slide));
}

void UMCMovementComponent::StopSlide()
{
    if (!IsSliding())
    {
        return;
    }

    SetMovementMode(MOVE_Walking);
    if (CharacterOwner)
    {
        CharacterOwner->UnCrouch();
    }
}

void UMCMovementComponent::PhysCustom(float DeltaTime, int32 Iterations)
{
    if (CustomMovementMode == static_cast<uint8>(EMCMoveMode::Slide))
    {
        PhysSlide(DeltaTime, Iterations);
        return;
    }

    Super::PhysCustom(DeltaTime, Iterations);
}

void UMCMovementComponent::PhysSlide(float DeltaTime, int32 Iterations)
{
    if (DeltaTime < MIN_TICK_TIME || !CharacterOwner)
    {
        return;
    }

    if (!CurrentFloor.IsWalkableFloor() || Velocity.Size2D() < 260.f)
    {
        StopSlide();
        StartNewPhysics(DeltaTime, Iterations);
        return;
    }

    const float PreviousFriction = GroundFriction;
    const float PreviousBraking = BrakingDecelerationWalking;

    GroundFriction = SlideGroundFriction;
    BrakingDecelerationWalking = SlideBrakingDeceleration;

    FVector Input = Acceleration;
    Input.Z = 0.f;
    if (!Input.IsNearlyZero())
    {
        Velocity += Input.GetSafeNormal() * MaxAcceleration * 0.18f * DeltaTime;
    }

    CalcVelocity(DeltaTime, GroundFriction, false, BrakingDecelerationWalking);

    FVector Delta = Velocity * DeltaTime;
    FHitResult Hit;
    SafeMoveUpdatedComponent(Delta, UpdatedComponent->GetComponentQuat(), true, Hit);

    if (Hit.IsValidBlockingHit())
    {
        SlideAlongSurface(Delta, 1.f - Hit.Time, Hit.Normal, Hit, true);
    }

    GroundFriction = PreviousFriction;
    BrakingDecelerationWalking = PreviousBraking;
}

#include "MCDeployableComponent.h"

#include "MCDeployableCover.h"
#include "Engine/World.h"
#include "GameFramework/Character.h"
#include "GameFramework/Controller.h"

UMCDeployableComponent::UMCDeployableComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
    SetIsReplicatedByDefault(true);
}

void UMCDeployableComponent::RequestDeploy(EMCDeployableType Type)
{
    ACharacter* Character = Cast<ACharacter>(GetOwner());
    if (!Character)
    {
        return;
    }

    FVector ViewLocation;
    FRotator ViewRotation;

    if (AController* Controller = Character->GetController())
    {
        Controller->GetPlayerViewPoint(ViewLocation, ViewRotation);
    }
    else
    {
        return;
    }

    const FVector End = ViewLocation + ViewRotation.Vector() * MaxDeployDistance;

    FHitResult Hit;
    FCollisionQueryParams Params(SCENE_QUERY_STAT(DeployTrace), true, Character);

    if (!GetWorld()->LineTraceSingleByChannel(
        Hit,
        ViewLocation,
        End,
        ECC_GameTraceChannel2,
        Params))
    {
        return;
    }

    const FVector Location = Hit.ImpactPoint + Hit.ImpactNormal * 8.f;
    const FRotator Rotation(0.f, ViewRotation.Yaw, 0.f);

    ServerDeploy(Type, Location, Rotation);
}

void UMCDeployableComponent::ServerDeploy_Implementation(
    EMCDeployableType Type,
    FVector_NetQuantize Location,
    FRotator Rotation)
{
    ACharacter* Character = Cast<ACharacter>(GetOwner());
    if (!Character || !GetWorld())
    {
        return;
    }

    RemoveInvalidDeployables();

    if (ActiveDeployables.Num() >= MaxActiveDeployables)
    {
        return;
    }

    if (FVector::DistSquared(Character->GetActorLocation(), Location) >
        FMath::Square(MaxDeployDistance + 150.f))
    {
        return;
    }

    TSubclassOf<AMCDeployableCover> CoverClass =
        Type == EMCDeployableType::LambrinWPC
        ? LambrinCoverClass
        : UltralamCoverClass;

    if (!CoverClass)
    {
        return;
    }

    FCollisionShape Shape = FCollisionShape::MakeBox(FVector(115.f, 20.f, 110.f));
    FCollisionQueryParams Params(SCENE_QUERY_STAT(DeployOverlap), false, Character);

    if (GetWorld()->OverlapBlockingTestByChannel(
        Location + FVector(0.f, 0.f, 110.f),
        FQuat(Rotation),
        ECC_WorldStatic,
        Shape,
        Params))
    {
        return;
    }

    FActorSpawnParameters SpawnParams;
    SpawnParams.Owner = Character;
    SpawnParams.Instigator = Character;
    SpawnParams.SpawnCollisionHandlingOverride =
        ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButDontSpawnIfColliding;

    if (AMCDeployableCover* Cover = GetWorld()->SpawnActor<AMCDeployableCover>(
        CoverClass,
        Location,
        Rotation,
        SpawnParams))
    {
        ActiveDeployables.Add(Cover);
    }
}

void UMCDeployableComponent::RemoveInvalidDeployables()
{
    ActiveDeployables.RemoveAll(
        [](const TWeakObjectPtr<AMCDeployableCover>& Cover)
        {
            return !Cover.IsValid();
        });
}

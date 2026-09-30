#include "MCWeaponComponent.h"

#include "Camera/CameraComponent.h"
#include "Engine/World.h"
#include "GameFramework/Character.h"
#include "GameFramework/Controller.h"
#include "Kismet/GameplayStatics.h"
#include "Net/UnrealNetwork.h"
#include "TimerManager.h"

UMCWeaponComponent::UMCWeaponComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
    SetIsReplicatedByDefault(true);
}

void UMCWeaponComponent::BeginPlay()
{
    Super::BeginPlay();
    Ammo = FMath::Clamp(Ammo, 0, MagazineSize);
}

void UMCWeaponComponent::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(UMCWeaponComponent, Ammo);
}

void UMCWeaponComponent::StartFire()
{
    FireOnce();

    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().SetTimer(
            FireTimer,
            this,
            &UMCWeaponComponent::FireOnce,
            FireInterval,
            true,
            FireInterval
        );
    }
}

void UMCWeaponComponent::StopFire()
{
    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().ClearTimer(FireTimer);
    }
}

void UMCWeaponComponent::FireOnce()
{
    ACharacter* Character = Cast<ACharacter>(GetOwner());
    if (!Character || Ammo <= 0)
    {
        StopFire();
        return;
    }

    FVector Start;
    FRotator ViewRotation;
    if (AController* Controller = Character->GetController())
    {
        Controller->GetPlayerViewPoint(Start, ViewRotation);
    }
    else
    {
        Start = Character->GetPawnViewLocation();
        ViewRotation = Character->GetActorRotation();
    }

    ServerFire(Start, ViewRotation.Vector());
}

void UMCWeaponComponent::ServerFire_Implementation(
    FVector_NetQuantize TraceStart,
    FVector_NetQuantizeNormal ShotDirection)
{
    ACharacter* Character = Cast<ACharacter>(GetOwner());
    if (!Character || Ammo <= 0 || !GetWorld())
    {
        return;
    }

    const double Now = GetWorld()->GetTimeSeconds();
    if (Now - LastServerShotTime < FireInterval * 0.88)
    {
        return;
    }

    if (FVector::DistSquared(TraceStart, Character->GetPawnViewLocation()) > FMath::Square(220.f))
    {
        return;
    }

    LastServerShotTime = Now;
    --Ammo;

    const FVector End = TraceStart + FVector(ShotDirection) * Range;

    FCollisionQueryParams Params(SCENE_QUERY_STAT(MaterialCombatWeapon), true, Character);
    Params.bReturnPhysicalMaterial = true;

    FHitResult Hit;
    FVector FinalEnd = End;

    if (GetWorld()->LineTraceSingleByChannel(Hit, TraceStart, End, ECC_GameTraceChannel1, Params))
    {
        FinalEnd = Hit.ImpactPoint;

        float AppliedDamage = Damage;
        if (Hit.BoneName == TEXT("head"))
        {
            AppliedDamage *= HeadshotMultiplier;
        }

        UGameplayStatics::ApplyPointDamage(
            Hit.GetActor(),
            AppliedDamage,
            FVector(ShotDirection),
            Hit,
            Character->GetController(),
            Character,
            nullptr
        );
    }

    MulticastFireFX(TraceStart, FinalEnd);
    OnRep_Ammo();
}

void UMCWeaponComponent::MulticastFireFX_Implementation(
    FVector_NetQuantize TraceStart,
    FVector_NetQuantize TraceEnd)
{
    // Blueprint/Cascade/Niagara hook:
    // muzzle flash, tracer, impact particles and audio.
}

void UMCWeaponComponent::Reload()
{
    ServerReload();
}

void UMCWeaponComponent::ServerReload_Implementation()
{
    if (Ammo >= MagazineSize || !GetWorld())
    {
        return;
    }

    StopFire();
    GetWorld()->GetTimerManager().SetTimer(
        ReloadTimer,
        this,
        &UMCWeaponComponent::FinishReload,
        ReloadDuration,
        false
    );
}

void UMCWeaponComponent::FinishReload()
{
    Ammo = MagazineSize;
    OnRep_Ammo();
}

void UMCWeaponComponent::OnRep_Ammo()
{
    // HUD can bind to this component or use a Blueprint event wrapper.
}

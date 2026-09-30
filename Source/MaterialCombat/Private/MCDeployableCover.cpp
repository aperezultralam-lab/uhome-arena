#include "MCDeployableCover.h"

#include "Components/StaticMeshComponent.h"
#include "Net/UnrealNetwork.h"

AMCDeployableCover::AMCDeployableCover()
{
    bReplicates = true;
    SetReplicateMovement(true);

    Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
    SetRootComponent(Mesh);

    Mesh->SetCollisionProfileName(TEXT("BlockAll"));
    Mesh->SetCanEverAffectNavigation(true);
}

void AMCDeployableCover::BeginPlay()
{
    Super::BeginPlay();
    Health = MaxHealth;
}

void AMCDeployableCover::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(AMCDeployableCover, Health);
}

float AMCDeployableCover::TakeDamage(
    float DamageAmount,
    FDamageEvent const& DamageEvent,
    AController* EventInstigator,
    AActor* DamageCauser)
{
    const float Applied = Super::TakeDamage(DamageAmount, DamageEvent, EventInstigator, DamageCauser);

    if (!HasAuthority() || Applied <= 0.f)
    {
        return Applied;
    }

    Health = FMath::Clamp(Health - Applied, 0.f, MaxHealth);
    OnRep_Health();

    if (Health <= 0.f)
    {
        Destroy();
    }

    return Applied;
}

void AMCDeployableCover::OnRep_Health()
{
    BP_OnHealthChanged(Health, MaxHealth);
}

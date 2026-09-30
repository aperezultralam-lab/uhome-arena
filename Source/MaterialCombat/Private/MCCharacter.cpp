#include "MCCharacter.h"

#include "Camera/CameraComponent.h"
#include "MCDeployableComponent.h"
#include "MCGameMode.h"
#include "MCMovementComponent.h"
#include "MCWeaponComponent.h"
#include "Components/CapsuleComponent.h"
#include "GameFramework/PlayerController.h"
#include "Net/UnrealNetwork.h"

AMCCharacter::AMCCharacter(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer.SetDefaultSubobjectClass<UMCMovementComponent>(
        ACharacter::CharacterMovementComponentName))
{
    bReplicates = true;

    GetCapsuleComponent()->InitCapsuleSize(42.f, 92.f);

    FirstPersonCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FirstPersonCamera"));
    FirstPersonCamera->SetupAttachment(GetCapsuleComponent());
    FirstPersonCamera->SetRelativeLocation(FVector(0.f, 0.f, 64.f));
    FirstPersonCamera->bUsePawnControlRotation = true;

    WeaponComponent = CreateDefaultSubobject<UMCWeaponComponent>(TEXT("WeaponComponent"));
    DeployableComponent = CreateDefaultSubobject<UMCDeployableComponent>(TEXT("DeployableComponent"));

    JumpMaxCount = 2;
    JumpMaxHoldTime = 0.12f;
    bUseControllerRotationYaw = true;
}

void AMCCharacter::BeginPlay()
{
    Super::BeginPlay();

    if (HasAuthority())
    {
        Health = MaxHealth;
    }
}

void AMCCharacter::GetLifetimeReplicatedProps(
    TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(AMCCharacter, Health);
}

void AMCCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    PlayerInputComponent->BindAxis(TEXT("MoveForward"), this, &AMCCharacter::MoveForward);
    PlayerInputComponent->BindAxis(TEXT("MoveRight"), this, &AMCCharacter::MoveRight);
    PlayerInputComponent->BindAxis(TEXT("Turn"), this, &APawn::AddControllerYawInput);
    PlayerInputComponent->BindAxis(TEXT("LookUp"), this, &APawn::AddControllerPitchInput);

    PlayerInputComponent->BindAction(TEXT("Jump"), IE_Pressed, this, &AMCCharacter::HandleJump);
    PlayerInputComponent->BindAction(TEXT("Sprint"), IE_Pressed, this, &AMCCharacter::StartSprint);
    PlayerInputComponent->BindAction(TEXT("Sprint"), IE_Released, this, &AMCCharacter::StopSprint);
    PlayerInputComponent->BindAction(TEXT("Slide"), IE_Pressed, this, &AMCCharacter::StartSlide);
    PlayerInputComponent->BindAction(TEXT("Slide"), IE_Released, this, &AMCCharacter::StopSlide);

    PlayerInputComponent->BindAction(TEXT("Fire"), IE_Pressed, this, &AMCCharacter::FirePressed);
    PlayerInputComponent->BindAction(TEXT("Fire"), IE_Released, this, &AMCCharacter::FireReleased);
    PlayerInputComponent->BindAction(TEXT("Reload"), IE_Pressed, this, &AMCCharacter::ReloadPressed);
    PlayerInputComponent->BindAction(TEXT("DeployPrimary"), IE_Pressed, this, &AMCCharacter::DeployPrimary);
}

void AMCCharacter::MoveForward(float Value)
{
    if (Controller && !FMath::IsNearlyZero(Value))
    {
        const FRotator Rotation(0.f, Controller->GetControlRotation().Yaw, 0.f);
        AddMovementInput(FRotationMatrix(Rotation).GetUnitAxis(EAxis::X), Value);
    }
}

void AMCCharacter::MoveRight(float Value)
{
    if (Controller && !FMath::IsNearlyZero(Value))
    {
        const FRotator Rotation(0.f, Controller->GetControlRotation().Yaw, 0.f);
        AddMovementInput(FRotationMatrix(Rotation).GetUnitAxis(EAxis::Y), Value);
    }
}

void AMCCharacter::StartSprint()
{
    if (UMCMovementComponent* Move = Cast<UMCMovementComponent>(GetCharacterMovement()))
    {
        Move->SetSprinting(true);
    }
}

void AMCCharacter::StopSprint()
{
    if (UMCMovementComponent* Move = Cast<UMCMovementComponent>(GetCharacterMovement()))
    {
        Move->SetSprinting(false);
    }
}

void AMCCharacter::StartSlide()
{
    if (UMCMovementComponent* Move = Cast<UMCMovementComponent>(GetCharacterMovement()))
    {
        Move->StartSlide();
    }
}

void AMCCharacter::StopSlide()
{
    if (UMCMovementComponent* Move = Cast<UMCMovementComponent>(GetCharacterMovement()))
    {
        Move->StopSlide();
    }
}

void AMCCharacter::HandleJump()
{
    const bool bWasFalling = GetCharacterMovement()->IsFalling();

    Jump();

    if (bWasFalling)
    {
        FVector Horizontal = GetVelocity();
        Horizontal.Z = 0.f;

        if (!Horizontal.IsNearlyZero())
        {
            const UMCMovementComponent* Move = Cast<UMCMovementComponent>(GetCharacterMovement());
            const float Boost = Move ? Move->BunnyHopBoost : 70.f;
            LaunchCharacter(Horizontal.GetSafeNormal() * Boost, false, false);
        }
    }
}

void AMCCharacter::FirePressed()
{
    if (WeaponComponent)
    {
        WeaponComponent->StartFire();
    }
}

void AMCCharacter::FireReleased()
{
    if (WeaponComponent)
    {
        WeaponComponent->StopFire();
    }
}

void AMCCharacter::ReloadPressed()
{
    if (WeaponComponent)
    {
        WeaponComponent->Reload();
    }
}

void AMCCharacter::DeployPrimary()
{
    if (DeployableComponent)
    {
        DeployableComponent->RequestDeploy(EMCDeployableType::LambrinWPC);
    }
}

float AMCCharacter::TakeDamage(
    float DamageAmount,
    FDamageEvent const& DamageEvent,
    AController* EventInstigator,
    AActor* DamageCauser)
{
    const float Applied = Super::TakeDamage(
        DamageAmount,
        DamageEvent,
        EventInstigator,
        DamageCauser);

    if (!HasAuthority() || Applied <= 0.f || Health <= 0.f)
    {
        return Applied;
    }

    Health = FMath::Clamp(Health - Applied, 0.f, MaxHealth);
    OnRep_Health();

    if (Health <= 0.f)
    {
        Die(EventInstigator);
    }

    return Applied;
}

void AMCCharacter::OnRep_Health()
{
    BP_OnHealthChanged(Health, MaxHealth);
}

void AMCCharacter::Die(AController* Killer)
{
    if (!HasAuthority())
    {
        return;
    }

    AController* VictimController = GetController();

    GetCapsuleComponent()->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    GetCharacterMovement()->DisableMovement();

    DetachFromControllerPendingDestroy();
    SetLifeSpan(3.f);

    if (AMCGameMode* GameMode = GetWorld()->GetAuthGameMode<AMCGameMode>())
    {
        GameMode->HandlePlayerDeath(VictimController, Killer);
    }
}

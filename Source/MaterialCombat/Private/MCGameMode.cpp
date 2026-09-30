#include "MCGameMode.h"

#include "MCCharacter.h"
#include "Engine/World.h"
#include "TimerManager.h"

AMCGameMode::AMCGameMode()
{
    DefaultPawnClass = AMCCharacter::StaticClass();
}

void AMCGameMode::HandlePlayerDeath(
    AController* VictimController,
    AController* KillerController)
{
    if (!VictimController || !GetWorld())
    {
        return;
    }

    TWeakObjectPtr<AController> WeakVictim(VictimController);

    FTimerDelegate RespawnDelegate;
    RespawnDelegate.BindLambda([this, WeakVictim]()
    {
        if (WeakVictim.IsValid())
        {
            RestartPlayer(WeakVictim.Get());
        }
    });

    FTimerHandle TimerHandle;
    GetWorldTimerManager().SetTimer(
        TimerHandle,
        RespawnDelegate,
        RespawnDelay,
        false);
}

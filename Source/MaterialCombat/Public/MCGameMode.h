#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "MCGameMode.generated.h"

UCLASS()
class MATERIALCOMBAT_API AMCGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    AMCGameMode();

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category="Match")
    float RespawnDelay = 2.2f;

    void HandlePlayerDeath(AController* VictimController, AController* KillerController);
};

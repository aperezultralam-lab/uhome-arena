using UnrealBuildTool;

public class MaterialCombat : ModuleRules
{
    public MaterialCombat(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore",
            "EnhancedInput",
            "NetCore",
            "PhysicsCore",
            "Chaos",
            "GeometryCollectionEngine",
            "FieldSystemEngine"
        });

        PrivateDependencyModuleNames.AddRange(new string[]
        {
            "Slate",
            "SlateCore"
        });
    }
}
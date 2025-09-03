import fs from "fs";
import path from "path";

export async function modifyScaffoldConfig(extensionName: string, targetDirectory: string) {
  if (!extensionName || extensionName.trim() === "") {
    return;
  }

  // Only modify for chainlink extensions
  if (extensionName !== "chainlink-vrf" && extensionName !== "chainlink-data-feed") {
    return;
  }

  const scaffoldConfigPath = path.join(targetDirectory, "packages", "nextjs", "scaffold.config.ts");
  
  if (!fs.existsSync(scaffoldConfigPath)) {
    return;
  }

  try {
    let content = fs.readFileSync(scaffoldConfigPath, 'utf8');
    
    // Replace arbitrumNitro with arbitrumSepolia for chainlink extensions
    content = content.replace(
      /targetNetworks:\s*\[chains\.arbitrumNitro\]/,
      'targetNetworks: [chains.arbitrumSepolia]'
    );
    
    fs.writeFileSync(scaffoldConfigPath, content);
  } catch (error) {
    console.warn(`Failed to modify scaffold.config.ts: ${error}`);
  }
}

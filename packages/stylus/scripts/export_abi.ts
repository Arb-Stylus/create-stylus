import * as path from "path";
import * as fs from "fs";
import {
  getExportConfig,
  ensureDeploymentDirectory,
  executeCommand,
  generateTsAbi,
  handleSolcError
} from "./utils";

export default async function exportStylusAbi() {
  console.log("📄 Starting Stylus ABI export...");

  const config = getExportConfig();

  if (!config.contractAddress) {
    console.error("❌ STYLUS_CONTRACT_ADDRESS environment variable is required for ABI export");
    console.error("💡 Please set STYLUS_CONTRACT_ADDRESS in your .env file or as an environment variable");
    process.exit(1);
  }

  console.log(`📄 Contract name: ${config.contractName}`);
  console.log(`📁 Deployment directory: ${config.deploymentDir}`);
  console.log(`📍 Contract address: ${config.contractAddress}`);

  try {
    // Ensure deployment directory exists
    ensureDeploymentDirectory(config.deploymentDir);

    // Export ABI
    const exportCommand = `cargo stylus export-abi --output='${config.deploymentDir}/${config.contractName}.txt' --json`;
    await executeCommand(exportCommand, path.resolve(__dirname, ".."), "Exporting ABI");

    console.log("\n🎉 ABI export completed successfully!");
    console.log(`📄 ABI file location: ${config.deploymentDir}/${config.contractName}.txt`);

    // Verify the ABI file was created
    const abiFilePath = path.resolve(__dirname, "..", config.deploymentDir, `${config.contractName}.txt`);
    if (fs.existsSync(abiFilePath)) {
      console.log(`✅ ABI file verified at: ${abiFilePath}`);
    } else {
      console.warn(`⚠️  ABI file not found at expected location: ${abiFilePath}`);
    }

    // Generate TypeScript ABI
    await generateTsAbi(abiFilePath, config.contractName, config.contractAddress);

  } catch (error) {
    handleSolcError(error as Error);
    process.exit(1);
  }
}

// Allow running this file directly
if (require.main === module) {
  exportStylusAbi().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
} 
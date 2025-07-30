import * as path from "path";
import * as fs from "fs";
import {
  getExportConfig,
  ensureDeploymentDirectory,
  executeCommand,
  generateTsAbi,
  handleSolcError,
} from "./utils/";

export async function exportStylusAbi(
  contractFolder: string,
  contractName: string,
  isSingleCommand: boolean = true,
) {
  console.log("📄 Starting Stylus ABI export...");

  const config = getExportConfig(contractFolder, contractName);

  // If contractAddress is not set, error and exit
  if (!config.contractAddress) {
    console.error(
      `❌ Contract address not found. Please deploy the contract first or ensure it is saved in ${path.resolve(config.deploymentDir, "addresses.json")}`,
    );
    process.exit(1);
  }

  if (isSingleCommand) {
    console.log(`📄 Contract name: ${config.contractName}`);
    console.log(`📁 Deployment directory: ${config.deploymentDir}`);
    console.log(`📍 Contract address: ${config.contractAddress}`);
    console.log(`🔗 Chain ID: ${config.chainId}`);
  }

  try {
    // Ensure deployment directory exists
    ensureDeploymentDirectory(config.deploymentDir);

    // Export ABI
    const exportCommand = `cargo stylus export-abi --output='../${config.deploymentDir}/${config.contractFolder}' --json`;
    await executeCommand(exportCommand, contractFolder, "Exporting ABI");

    console.log(
      `📄 ABI file location: ${config.deploymentDir}/${config.contractFolder}`,
    );

    // Verify the ABI file was created
    const abiFilePath = path.resolve(
      config.deploymentDir,
      `${config.contractFolder}`,
    );
    if (fs.existsSync(abiFilePath)) {
      console.log(`✅ ABI file verified at: ${abiFilePath}`);
    } else {
      console.warn(
        `⚠️  ABI file not found at expected location: ${abiFilePath}`,
      );
    }

    // do not Generate TypeScript ABI when called from yarn script
    if (!isSingleCommand) {
      await generateTsAbi(
        abiFilePath,
        config.contractName,
        config.contractAddress,
        config.chainId,
      );
    }
  } catch (error) {
    handleSolcError(error as Error);
    process.exit(1);
  }
}

// Allow running this file directly
if (require.main === module) {
  // Get contract folder from command line args, default to 'your-contract'
  const contractFolder = process.argv[2] || "your-contract";
  if (!fs.existsSync(contractFolder)) {
    console.error(`❌ Contract folder does not exist: ${contractFolder}`);
    process.exit(1);
  }
  exportStylusAbi(contractFolder, contractFolder).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

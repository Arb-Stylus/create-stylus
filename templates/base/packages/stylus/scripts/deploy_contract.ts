import {
  getDeploymentConfig,
  ensureDeploymentDirectory,
  executeCommand,
  generateContractAddress,
  extractDeployedAddress,
  saveDeployedAddress,
  clearDeploymentDir,
  // estimateGasPrice,
} from "./utils/";
import { exportStylusAbi } from "./export_abi";
import {
  DeployOptions,
  AdditionalOptions,
} from "./utils/type";
import { buildDeployCommand } from "./utils/command";

/**
 * Deploy a single contract using cargo stylus
 * @param deployOptions - The deploy options
 * @param additionalOptions - The additional options
 * @returns void
 */
export default async function deployStylusContract(
  deployOptions: DeployOptions,
  additionalOptions: AdditionalOptions = {
    isSingleCommand: true,
    shouldClearDeploymentDir: false,
  },
) {
  console.log(`\n🚀 Deploying contract in: ${deployOptions.contract}`);

  const config = getDeploymentConfig(deployOptions);
  if (additionalOptions.shouldClearDeploymentDir) {
    clearDeploymentDir();
    ensureDeploymentDirectory(config.deploymentDir);
  }

  console.log(`📄 Contract name: ${config.contractName}`);

  config.contractAddress = generateContractAddress();

  if (additionalOptions.isSingleCommand) {
    console.log(`📡 Using endpoint: ${config.chain?.rpcUrl}`);
    if (config.chain) {
      console.log(`🌐 Network specified: ${config.chain?.name}`);
    }
    console.log(
      `🔑 Using private key: ${config.privateKey.substring(0, 10)}...`,
    );
    console.log(`📁 Deployment directory: ${config.deploymentDir}`);
  }

  try {
    // Step 1: Deploy the contract using cargo stylus with contract address
    // --contract-address='${config.contractAddress}' deactivated for now as it's not working. Issue https://github.com/OffchainLabs/cargo-stylus/issues/171
    const deployCommand = await buildDeployCommand(config, deployOptions);
    const deployOutput = await executeCommand(
      deployCommand,
      deployOptions.contract!,
      "Deploying contract with cargo stylus",
    );

    if (deployOptions.estimateGas) {
      console.log(deployOutput);
      process.exit(0);
    }

    // Extract the actual deployed address from the output
    const deployedAddress = extractDeployedAddress(deployOutput);
    if (deployedAddress) {
      config.contractAddress = deployedAddress;
      console.log(`📋 Contract deployed at address: ${config.contractAddress}`);
    } else {
      console.log(`📋 Using fallback address: ${config.contractAddress}`);
    }

    // Save the deployed address to addresses.json
    saveDeployedAddress(config);

    // Step 2: Export ABI using the shared function
    await exportStylusAbi(config.contractFolder, config.contractName, false);

    console.log(`✅ Successfully deployed contract in: ${deployOptions.contract}`);
    if (additionalOptions.isSingleCommand) {
      console.log(`📋 Contract deployed at address: ${config.contractAddress}`);
      console.log(`📋 Chain ID: ${config.chain?.id}`);
    }
  } catch (error) {
    console.error(`❌ Deployment failed in: ${deployOptions.contract}`, error);
    process.exit(1);
  }
}
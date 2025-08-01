import {
  getDeploymentConfig,
  ensureDeploymentDirectory,
  executeCommand,
  extractDeploymentInfo,
  saveDeployment,
  // estimateGasPrice,
} from "./utils/";
import { exportStylusAbi } from "./export_abi";
import { DeployOptions } from "./utils/type";
import { buildDeployCommand } from "./utils/command";

/**
 * Deploy a single contract using cargo stylus
 * @param deployOptions - The deploy options
 * @param additionalOptions - The additional options
 * @returns void
 */
export default async function deployStylusContract(
  deployOptions: DeployOptions,
) {
  console.log(`\n🚀 Deploying contract in: ${deployOptions.contract}`);

  const config = getDeploymentConfig(deployOptions);
  ensureDeploymentDirectory(config.deploymentDir);

  console.log(`📄 Contract name: ${config.contractName}`);

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
      return;
    }

    // Extract the actual deployed address from the output
    const deploymentInfo = extractDeploymentInfo(deployOutput);
    if (deploymentInfo) {
      console.log(`📋 Contract deployed at address: ${deploymentInfo.address}`);
      console.log("Transaction hash: ", deploymentInfo.txHash);
    } else {
      throw new Error("Failed to extract deployed address");
    }

    // Save the deployed address to chain-specific deployment file
    saveDeployment(config, deploymentInfo);

    // Step 2: Export ABI using the shared function
    await exportStylusAbi(
      config.contractFolder,
      config.contractName,
      false,
      config.chain?.id,
    );

    // Step 3: Verify the contract
    if (deployOptions.verify) {
      try {
        const output = await executeCommand(
          `cargo stylus verify --endpoint=${config.chain?.rpcUrl} --deployment-tx=${deploymentInfo.txHash}`,
          deployOptions.contract!,
          "Verifying contract with cargo stylus",
        );
        console.log(output);
      } catch (error) {
        console.error(
          `❌ Verification failed in: ${deployOptions.contract}`,
          error,
        );
      }
    }
  } catch (error) {
    console.error(`❌ Deployment failed in: ${deployOptions.contract}`, error);
    process.exit(1);
  }
}

import * as fs from "fs";
import * as path from "path";
import deployStylusContract from "./deploy_contract";
import {
  clearDeploymentDir,
  ensureDeploymentDirectory,
  getDeploymentConfig,
  isContractFolder,
  printDeployedAddresses,
} from "./utils/";
import { DeployOptions } from "./utils/type";

/**
 * Deploy all contracts in the stylus folder
 * @param deployOptions - The deploy options
 * @returns void
 */
export default async function deployAllStylusContracts(
  deployOptions: DeployOptions,
) {
  const contractsRoot = ".";
  const entries = fs.readdirSync(contractsRoot, { withFileTypes: true });

  const config = getDeploymentConfig(deployOptions);
  clearDeploymentDir();
  ensureDeploymentDirectory(config.deploymentDir);

  console.log(`📄 Deploying all contracts`);
  console.log(`📡 Using endpoint: ${config.chain?.rpcUrl}`);
  if (config.chain) {
    console.log(`🌐 Network specified: ${config.chain?.name}`);
  }
  console.log(`🔑 Using private key: ${config.privateKey.substring(0, 10)}...`);
  console.log(`📁 Deployment directory: ${config.deploymentDir}`);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const contractFolder = path.join(contractsRoot, entry.name);
    if (isContractFolder(contractFolder)) {
      try {
        await deployStylusContract(
          {
            contract: entry.name,
            ...deployOptions,
          },
          {
            isSingleCommand: false,
          },
        );
      } catch (e) {
        console.error(`❌ Failed to deploy contract in: ${contractFolder}`);
        console.error(e);
      }
    }
  }

  console.log("\n\n");
  printDeployedAddresses(config.deploymentDir);
}

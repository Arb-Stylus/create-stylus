import deployStylusContract from "./deploy_contract";
import {
  getDeploymentConfig,
  printDeployedAddresses,
} from "./utils/";
import { DeployOptions } from "./utils/type";

/**
 * Define your deployment logic here
 */
export default async function deployScript(deployOptions: DeployOptions) {
  // Deploy a single contract
  await deployStylusContract({
    contract: "your-contract",
    ...deployOptions,
  });

  // deploy your contract with a custom name
  await deployStylusContract({
    contract: "your-contract",
    name: "my-contract",
    ...deployOptions,
  });

  // Print the deployed addresses
  const config = getDeploymentConfig(deployOptions);
  console.log("\n\n");
  printDeployedAddresses(config.deploymentDir);
}

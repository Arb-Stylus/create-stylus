import { config as dotenvConfig } from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { arbitrumNitro } from "../../../nextjs/utils/scaffold-stylus/chain";
import { DeploymentConfig, DeployOptions } from "./type";
import { getChain, getPrivateKey } from "./network";
import { getContractNameFromCargoToml } from "./contract";

// Load environment variables from .env file
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  dotenvConfig({ path: envPath });
}

export function clearDeploymentDir(): void {
  const deploymentDir = process.env["DEPLOYMENT_DIR"] || "deployments";
  if (fs.existsSync(deploymentDir)) {
    fs.rmSync(deploymentDir, { recursive: true });
  }
}

export function getDeploymentConfig(
  deployOptions: DeployOptions,
): DeploymentConfig {
  // If network is specified, try to get RPC URL from viem chains
  if (!deployOptions.network) deployOptions.network = "devnet";

  const chain = getChain(deployOptions.network);
  if (!chain) throw new Error(`Network ${deployOptions.network} not found`);

  let contractName: string;
  if (deployOptions.contract) {
    try {
      contractName =
        deployOptions.name ||
        getContractNameFromCargoToml(deployOptions.contract);
    } catch (e) {
      throw new Error(`❌ Could not read contract name from Cargo.toml: ${e}`);
    }
  } else {
    contractName = "your-contract";
  }

  return {
    privateKey: getPrivateKey(deployOptions.network),
    contractFolder: deployOptions.contract!,
    contractName,
    deploymentDir: process.env["DEPLOYMENT_DIR"] || "deployments",
    chain,
  };
}

export function ensureDeploymentDirectory(deploymentDir: string): void {
  if (!fs.existsSync(deploymentDir)) {
    console.log(`📁 Creating deployment directory: ${deploymentDir}`);
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
}

/**
 * Save the deployed contract address to addresses.json in the deployment directory.
 * Updates or creates the file, using contractName as the key.
 */
export function saveDeployedAddress(config: DeploymentConfig) {
  try {
    const addressesPath = path.resolve(config.deploymentDir, "addresses.json");
    let addresses: Record<string, any> = {};
    if (fs.existsSync(addressesPath)) {
      const content = fs.readFileSync(addressesPath, "utf8");
      try {
        addresses = JSON.parse(content);
      } catch (e) {
        console.warn(
          `⚠️  Could not parse existing addresses.json, will overwrite. Error: ${e}`,
        );
      }
    }

    // Save both address and chain ID
    addresses[config.contractName] = {
      address: config.contractAddress || "",
      chainId: (config.chain?.id || arbitrumNitro.id).toString(),
    };

    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log(`💾 Saved deployed address and chain ID to ${addressesPath}`);
  } catch (e) {
    console.error(`❌ Failed to save deployed address: ${e}`);
  }
}

export function printDeployedAddresses(deploymentDir: string): void {
  const addressesPath = path.resolve(deploymentDir, "addresses.json");
  if (fs.existsSync(addressesPath)) {
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    console.log(`📦 Deployed contract addresses (${addressesPath}):`);

    // Format the output to show contract name, address, and chain ID clearly
    Object.entries(addresses).forEach(([contractName, contractData]) => {
      const data = contractData as {
        address: string;
        chainId: string;
      };
      console.log(`  ${contractName}:`);
      console.log(`    Address: ${data.address}`);
      console.log(`    Chain ID: ${data.chainId}`);
    });
  }
}

/**
 * Reads the deployed contract data from addresses.json in the deployment directory.
 * Returns an object with address and chainId for the given contractName, or undefined if not found.
 */
export function getContractDataFromDeployments(
  deploymentDir: string,
  contractName: string,
): { address: string; chainId: string } | undefined {
  const addressesPath = path.resolve(deploymentDir, "addresses.json");
  if (fs.existsSync(addressesPath)) {
    try {
      const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
      if (addresses[contractName]?.address) {
        return addresses[contractName] as {
          address: string;
          chainId: string;
        };
      }
    } catch (e) {
      console.warn(
        `⚠️  Could not parse addresses.json at ${addressesPath}: ${e}`,
      );
    }
  }
  return undefined;
}

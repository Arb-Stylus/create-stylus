import { spawn } from "child_process";
import { config as dotenvConfig } from "dotenv";
import prettier from "prettier";
import * as path from "path";
import * as fs from "fs";
import { ethers } from "ethers";
import { arbitrumNitro } from "../../nextjs/utils/scaffold-stylus/chain";
import scaffoldConfig from "../../nextjs/scaffold.config";

// Load environment variables from .env file
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenvConfig({ path: envPath });
}

export interface DeploymentConfig {
  endpoint: string;
  privateKey: string;
  contractName: string;
  deploymentDir: string;
  contractAddress?: string;
}

export interface ExportConfig {
  contractName: string;
  deploymentDir: string;
  contractAddress: string | undefined;
}

export const generatedContractComment = `
/**
 * This file is autogenerated by Scaffold-Stylus.
 * You should not edit it manually or your changes might be overwritten.
 */
`;

export function getDeploymentConfig(): DeploymentConfig {
  return {
    endpoint: process.env["RPC_URL"] || "http://localhost:8547",
    privateKey: process.env["PRIVATE_KEY"] || "0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659",
    contractName: process.env["CONTRACT_NAME"] || "stylus-hello-world",
    deploymentDir: process.env["DEPLOYMENT_DIR"] || "./deployments",
  };
}

export function getExportConfig(): ExportConfig {
  return {
    contractName: process.env["CONTRACT_NAME"] || "stylus-hello-world",
    deploymentDir: process.env["DEPLOYMENT_DIR"] || "./deployments",
    contractAddress: process.env["STYLUS_CONTRACT_ADDRESS"],
  };
}

export function ensureDeploymentDirectory(deploymentDir: string): void {
  const fullPath = path.resolve(__dirname, "..", deploymentDir);
  if (!fs.existsSync(fullPath)) {
    console.log(`📁 Creating deployment directory: ${fullPath}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

export function executeCommand(command: string, cwd: string, description: string): Promise<string> {
  console.log(`\n🔄 ${description}...`);
  console.log(`Executing: ${command}`);

  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, [], {
      cwd,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';
    const outputLines: string[] = [];
    let errorLines: string[] = [];

    // Handle stdout
    if (childProcess.stdout) {
      childProcess.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        output += chunk;
        const newLines = chunk.split('\n');
        outputLines.push(...newLines);
      });
    }

    // Handle stderr
    if (childProcess.stderr) {
      childProcess.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        errorOutput += chunk;
        const newLines = chunk.split('\n');
        errorLines.push(...newLines);
        // Keep only the last 5 lines
        if (errorLines.length > 5) {
          errorLines = errorLines.slice(-5);
        }
      });
    }

    // Handle process completion
    childProcess.on('close', (code: number | null) => {
      if (code === 0) {
        console.log(`\n✅ ${description} completed successfully!`);
        // Print output starting from "project metadata hash computed on deployment" or all logs if not found
        if (outputLines.length > 0) {
          const startIndex = outputLines.findIndex(line => 
            line.includes("project metadata hash computed on deployment")
          );
          if (startIndex >= 0) {
            const linesToPrint = outputLines.slice(startIndex);
            linesToPrint.forEach(line => {
              if (line.trim()) console.log(line);
            });
          } else {
            outputLines.forEach(line => {
              if (line.trim()) console.log(line);
            });
          }
        }
        resolve(output);
      } else {
        console.error(`\n❌ ${description} failed with exit code ${code}`);
        // Print error output starting from "project metadata hash computed on deployment" or all logs if not found
        if (errorLines.length > 0) {
          const startIndex = errorLines.findIndex(line => 
            line.includes("project metadata hash computed on deployment")
          );
          if (startIndex >= 0) {
            const linesToPrint = errorLines.slice(startIndex);
            linesToPrint.forEach(line => {
              if (line.trim()) console.error(line);
            });
          } else {
            errorLines.forEach(line => {
              if (line.trim()) console.error(line);
            });
          }
        }
        if (errorOutput) {
          console.error(errorOutput);
        }
        reject(new Error(`Command failed with exit code ${code}. Error output: ${errorOutput}`));
      }
    });

    // Handle process errors
    childProcess.on('error', (error: Error) => {
      console.error(`\n❌ ${description} failed:`, error);
      reject(error);
    });
  });
}

export async function generateTsAbi(abiFilePath: string, contractName: string, contractAddress: string) {
  const TARGET_DIR = "../nextjs/contracts/";
  const abiTxt = fs.readFileSync(abiFilePath, "utf8");
  
  // Extract from 4th row to the end
  const lines = abiTxt.split('\n');
  const extractedAbi = lines.slice(3).join('\n');

  const fileContent = `${scaffoldConfig.targetNetworks[0]?.id || arbitrumNitro.id}:{"${contractName}":{address:"${contractAddress}",abi:${extractedAbi}}}`;

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR);
  }

  fs.writeFileSync(
    `${TARGET_DIR}deployedContracts.ts`,
    await prettier.format(
      `${generatedContractComment} import { GenericContractsDeclaration } from "~~/utils/scaffold-stylus/contract"; \n\n
 const deployedContracts = {${fileContent}} as const; \n\n export default deployedContracts satisfies GenericContractsDeclaration`,
      {
        parser: "typescript",
      },
    ),
  );

  console.log(`📝 Updated TypeScript contract definition file on ${TARGET_DIR}deployedContracts.ts`);
}

export function handleSolcError(error: Error, context: string = "ABI export"): void {
  console.error(`\n❌ ${context} failed!`);
  console.error("\n🔍 Error details:", error.message);
  
  // Check if the error is related to solc not being found
  if (error.message.includes("solc") || error.message.includes("solidity") || error.message.includes("command not found")) {
    console.error("\n💡 It appears that the Solidity compiler (solc) is not installed on your system.");
    console.error("\n📚 To install Solidity, please visit:");
    console.error("   https://docs.soliditylang.org/en/latest/installing-solidity.html");
    console.error("\n🚀 After installing solc, you can run this command again:");
    console.error("   yarn export-abi");
    console.error("\n📋 Quick installation options:");
    console.error("   • npm: npm install --global solc");
    console.error("   • Docker: docker run ethereum/solc:stable --help");
    console.error("   • Homebrew (macOS): brew install solidity");
    console.error("   • Linux: sudo apt-get install solc");
  } else {
    console.error("\n💡 Please check the error details above and try again.");
  }
}

export function generateContractAddress(): string {
  // Generate a random private key and derive the address
  const wallet = ethers.Wallet.createRandom();
  return wallet.address;
}

export function extractDeployedAddress(output: string): string | null {
  // Look for the line containing "deployed code at address:"
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.includes('deployed code at address:')) {
      // Simple approach: just extract the hex address directly
      const hexMatch = line.match(/(0x[a-fA-F0-9]{40})/);
      if (hexMatch && hexMatch[1]) {
        return hexMatch[1];
      }
    }
  }
  return null;
} 
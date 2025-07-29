import * as fs from "fs";
import deployStylusContract from "./deploy_contract";
import { hideBin } from "yargs/helpers";
import yargs from "yargs";
import { DeployCommandOptions, DeployOptions } from "./utils/type";
import deployAllStylusContracts from "./deploy_all_contracts";
import deployScript from "./deploy";

/**
 * Entry point for the deploy script
 * This script is used to deploy a single contract or all contracts in the stylus folder
 */
if (require.main === module) {
  // Use yargs for argument parsing
  const argv = yargs(hideBin(process.argv))
    .usage("Usage: yarn deploy --name <contractName> --network <network>")
    .option("all", {
      alias: "a",
      describe: "Deploy all contracts in the stylus folder",
      type: "boolean",
      demandOption: false,
    })
    .option("contract", {
      alias: "c",
      describe: "Name of the contract folder",
      type: "string",
      demandOption: false,
    })
    .option("name", {
      alias: "n",
      describe: "Name of the contract",
      type: "string",
      demandOption: false,
    })
    .option("network", {
      alias: "net",
      describe: "Network to deploy to",
      type: "string",
      demandOption: false,
    })
    .option("estimate-gas", {
      alias: "eg",
      describe: "Estimate gas for the deployment",
      type: "boolean",
      demandOption: false,
    })
    .option("max-fee", {
      alias: "mf",
      describe: "Max fee per gas gwei",
      type: "string",
      demandOption: false,
    })
    .help()
    .parseSync() as DeployCommandOptions;

  if (argv.all) {
    deployAllStylusContracts(argv as DeployOptions).catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
  } else if (argv.contract) {
    if (!fs.existsSync(argv.contract)) {
      console.error(`❌ Contract folder does not exist: ${argv.contract}`);
      process.exit(1);
    }

    deployStylusContract(argv as DeployOptions, {
      shouldClearDeploymentDir: true,
    }).catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
  } else {
    deployScript(argv as DeployOptions).catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
  }
}

import scaffoldConfig from "~~/scaffold.config";
import { contracts } from "~~/utils/create-stylus/contract";

export function getAllContracts() {
  const contractsData = contracts?.[scaffoldConfig.targetNetworks[0].id];
  return contractsData ? contractsData : {};
}

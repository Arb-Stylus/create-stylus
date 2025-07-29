import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { ConnectorData } from "wagmi";

export type BurnerConnectorOptions = {
  defaultChainId: number;
  privateKey?: string;
};

export type BurnerConnectorData = ConnectorData & {
  provider: StaticJsonRpcProvider;
};

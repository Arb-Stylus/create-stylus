interface BaseCommandOptions {
  _: (string | number)[];
  $0: string;
  [x: string]: unknown;
}

export interface DeployCommandOptions
  extends BaseCommandOptions,
    DeployOptions {
  all?: boolean;
}

export interface AdditionalOptions {
  isSingleCommand?: boolean;
  shouldClearDeploymentDir?: boolean;
}

export interface DeployOptions {
  contract?: string;
  name?: string;
  network?: string;
  estimateGas?: boolean;
  maxFee?: string;
}

export interface DeploymentConfig {
  privateKey: string;
  contractFolder: string;
  contractName: string;
  deploymentDir: string;
  contractAddress?: string;
  chain?: SupportedNetworkMinimal;
}

export interface ExportConfig {
  contractFolder: string;
  contractName: string;
  deploymentDir: string;
  contractAddress: string | undefined;
  chainId: string;
}

export interface SupportedNetworkMinimal {
  name: string;
  alias: string;
  id: string;
  rpcUrl: string;
}

import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { Address, Chain, HttpTransport, PrivateKeyAccount, WalletClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Connector } from "wagmi";
import { loadBurnerSK } from "~~/hooks/scaffold-stylus";
import { BurnerConnectorError, BurnerConnectorErrorList } from "~~/services/web3/wagmi-burner/BurnerConnectorErrors";
import { BurnerConnectorData, BurnerConnectorOptions } from "~~/services/web3/wagmi-burner/BurnerConnectorTypes";

export const burnerWalletId = "burner-wallet";
export const burnerWalletName = "Burner Wallet";

/**
 * This class is a wagmi connector for BurnerWallet.  Its used by {@link burnerWalletConfig}
 */
export class BurnerConnector extends Connector<StaticJsonRpcProvider, BurnerConnectorOptions> {
  readonly id = burnerWalletId;
  readonly name = burnerWalletName;
  readonly ready = true;

  private provider?: StaticJsonRpcProvider;

  // store for getWallet()
  private burnerWallet: WalletClient<HttpTransport, Chain, PrivateKeyAccount> | undefined;

  constructor(config: { chains?: Chain[]; options: BurnerConnectorOptions }) {
    super(config);
    this.burnerWallet = undefined;
  }

  async getProvider() {
    if (!this.provider) {
      const chain = this.getChainFromId();
      this.provider = new StaticJsonRpcProvider(chain.rpcUrls.default.http[0]);
    }
    return this.provider;
  }

  async getWalletClient(config?: { chainId?: number | undefined } | undefined) {
    const chain = this.getChainFromId(config?.chainId);
    if (!this.burnerWallet) {
      // Use provided private key if available, otherwise fall back to localStorage
      const privateKey = (this.options.privateKey || loadBurnerSK()) as `0x${string}`;
      const burnerAccount = privateKeyToAccount(privateKey);

      const client = createWalletClient({
        chain: chain,
        account: burnerAccount,
        transport: http(),
      });
      this.burnerWallet = client;
    }
    return Promise.resolve(this.burnerWallet);
  }

  async connect(config?: { chainId?: number | undefined } | undefined): Promise<Required<BurnerConnectorData>> {
    const chain = this.getChainFromId(config?.chainId);

    this.provider = new StaticJsonRpcProvider(chain.rpcUrls.default.http[0]);
    const account = await this.getAccount();

    if (this.provider == null || account == null) {
      throw new BurnerConnectorError(BurnerConnectorErrorList.couldNotConnect);
    }

    if (!account) {
      throw new BurnerConnectorError(BurnerConnectorErrorList.accountNotFound);
    }

    const data: Required<BurnerConnectorData> = {
      account,
      chain: {
        id: chain.id,
        unsupported: false,
      },
      provider: this.provider,
    };

    return Promise.resolve(data);
  }

  private getChainFromId(chainId?: number) {
    const resolveChainId = chainId ?? this.options.defaultChainId;
    const chain = this.chains.find(f => f.id === resolveChainId);
    if (chain == null) {
      throw new BurnerConnectorError(BurnerConnectorErrorList.chainNotSupported);
    }
    return chain;
  }

  disconnect(): Promise<void> {
    console.log("disconnect from burnerwallet");
    return Promise.resolve();
  }

  async getAccount(): Promise<Address> {
    const privateKey = (this.options.privateKey || loadBurnerSK()) as `0x${string}`;
    const burnerAccount = privateKeyToAccount(privateKey);
    return burnerAccount.address as Address;
  }

  async getChainId(): Promise<number> {
    const network = await this.provider?.getNetwork();
    const chainId = network?.chainId ?? this.options.defaultChainId;
    if (chainId == null) {
      throw new BurnerConnectorError(BurnerConnectorErrorList.chainIdNotResolved);
    }

    return Promise.resolve(chainId);
  }

  async isAuthorized() {
    try {
      const account = await this.getAccount();
      return !!account;
    } catch {
      return false;
    }
  }

  protected async onAccountsChanged() {
    const chainId = await this.getChainId();
    const chain = this.getChainFromId(chainId);
    const privateKey = (this.options.privateKey || loadBurnerSK()) as `0x${string}`;
    const burnerAccount = privateKeyToAccount(privateKey);

    const client = createWalletClient({
      chain: chain,
      account: burnerAccount,
      transport: http(),
    });
    this.burnerWallet = client;
  }

  async switchChain(chainId: number) {
    const chain = this.getChainFromId(chainId);
    this.provider = new StaticJsonRpcProvider(chain.rpcUrls.default.http[0]);

    await this.onChainChanged();
    return chain;
  }

  protected async onChainChanged() {
    const chainId = await this.getChainId();
    const chain = this.getChainFromId(chainId);
    const privateKey = (this.options.privateKey || loadBurnerSK()) as `0x${string}`;
    const burnerAccount = privateKeyToAccount(privateKey);

    const client = createWalletClient({
      chain: chain,
      account: burnerAccount,
      transport: http(),
    });
    this.burnerWallet = client;
    this.emit("change", { chain: { id: chainId, unsupported: false } });
  }

  protected onDisconnect(error: Error): void {
    if (error) console.warn(error);
  }
}

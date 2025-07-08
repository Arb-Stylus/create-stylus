"use client";

import { useState } from "react";
import { Address as AddressType, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { useNetwork } from "wagmi";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { Address, AddressInput, Balance, EtherInput } from "~~/components/scaffold-eth";
import { useTransactor } from "~~/hooks/scaffold-stylus";
import { arbitrumNitro } from "~~/utils/scaffold-stylus/chain";

const localWalletClient = createWalletClient({
  account: privateKeyToAccount(arbitrumNitro.accounts[0].privateKey),
  chain: arbitrumNitro,
  transport: http(arbitrumNitro.rpcUrls.default.http[0]),
});

/**
 * Faucet modal which lets you send ETH to any address.
 */
export const Faucet = () => {
  const [loading, setLoading] = useState(false);
  const [inputAddress, setInputAddress] = useState<AddressType>();
  const [faucetAddress] = useState<AddressType>(arbitrumNitro.accounts[0].address);
  const [sendValue, setSendValue] = useState("");

  const { chain: ConnectedChain } = useNetwork();

  const faucetTxn = useTransactor(localWalletClient);

  const sendETH = async () => {
    if (!faucetAddress) {
      return;
    }
    try {
      setLoading(true);
      // @ts-ignore
      await faucetTxn({
        to: inputAddress,
        value: parseEther(sendValue as `${number}`),
      });
      setLoading(false);
      setInputAddress(undefined);
      setSendValue("");
    } catch (error) {
      console.error("⚡️ ~ file: Faucet.tsx:sendETH ~ error", error);
      setLoading(false);
    }
  };

  // Render only on local chain
  if (ConnectedChain?.id !== arbitrumNitro.id) {
    return null;
  }

  return (
    <div>
      <label htmlFor="faucet-modal" className="btn btn-primary btn-sm font-normal gap-1">
        <BanknotesIcon className="h-4 w-4" />
        <span>Faucet</span>
      </label>
      <input type="checkbox" id="faucet-modal" className="modal-toggle" />
      <label htmlFor="faucet-modal" className="modal cursor-pointer">
        <label className="modal-box relative">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3">Local Faucet</h3>
          <label htmlFor="faucet-modal" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>
          <div className="space-y-3">
            <div className="flex space-x-4">
              <div>
                <span className="text-sm font-bold">From:</span>
                <Address address={faucetAddress} />
              </div>
              <div>
                <span className="text-sm font-bold pl-3">Available:</span>
                <Balance address={faucetAddress} />
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <AddressInput
                placeholder="Destination Address"
                value={inputAddress ?? ""}
                onChange={value => setInputAddress(value as AddressType)}
              />
              <EtherInput placeholder="Amount to send" value={sendValue} onChange={value => setSendValue(value)} />
              <button className="h-10 btn btn-primary btn-sm px-2 rounded-full" onClick={sendETH} disabled={loading}>
                {!loading ? (
                  <BanknotesIcon className="h-6 w-6" />
                ) : (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};

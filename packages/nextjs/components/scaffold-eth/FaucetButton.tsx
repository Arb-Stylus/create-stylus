"use client";

import { useState } from "react";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { useAccount, useNetwork } from "wagmi";
import { useBalance } from "wagmi";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useTransactor } from "~~/hooks/scaffold-stylus";
import { arbitrumNitro } from "~~/utils/scaffold-stylus/chain";

// Number of ETH faucet sends to an address
const NUM_OF_ETH = "1";

const localWalletClient = createWalletClient({
  account: privateKeyToAccount(arbitrumNitro.accounts[0].privateKey),
  chain: arbitrumNitro,
  transport: http(arbitrumNitro.rpcUrls.default.http[0]),
});

/**
 * FaucetButton button which lets you grab eth.
 */
export const FaucetButton = () => {
  const { address } = useAccount();

  const { data: balance } = useBalance({
    address,
    watch: true,
  });

  const { chain: ConnectedChain } = useNetwork();

  const [loading, setLoading] = useState(false);

  const faucetTxn = useTransactor(localWalletClient);

  const sendETH = async () => {
    try {
      setLoading(true);
      // @ts-ignore
      await faucetTxn({
        to: address,
        value: parseEther(NUM_OF_ETH),
      });
      setLoading(false);
    } catch (error) {
      console.error("⚡️ ~ file: FaucetButton.tsx:sendETH ~ error", error);
      setLoading(false);
    }
  };

  // Render only on local chain
  if (ConnectedChain?.id !== arbitrumNitro.id) {
    return null;
  }

  const isBalanceZero = balance && balance.value === 0n;

  return (
    <div
      className={
        !isBalanceZero
          ? "ml-1"
          : "ml-1 tooltip tooltip-bottom tooltip-secondary tooltip-open font-bold before:left-auto before:transform-none before:content-[attr(data-tip)] before:right-0"
      }
      data-tip="Grab funds from faucet"
    >
      <button className="btn btn-secondary btn-sm px-2 rounded-full" onClick={sendETH} disabled={loading}>
        {!loading ? (
          <BanknotesIcon className="h-4 w-4" />
        ) : (
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </button>
    </div>
  );
};

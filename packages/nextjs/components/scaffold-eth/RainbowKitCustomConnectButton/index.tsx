"use client";

// @refresh reset
import { useState } from "react";
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { BurnerWalletModal } from "./BurnerWalletModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { useConnect } from "wagmi";
import { useAutoConnect, useNetworkColor } from "~~/hooks/scaffold-stylus";
import { useTargetNetwork } from "~~/hooks/scaffold-stylus/useTargetNetwork";
import { burnerWalletConfig } from "~~/services/web3/wagmi-burner/burnerWalletConfig";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-stylus";
import { getTargetNetworks } from "~~/utils/scaffold-stylus";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
  useAutoConnect();
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const [isBurnerModalOpen, setIsBurnerModalOpen] = useState(false);
  const { connectAsync } = useConnect();
  const targetNetworks = getTargetNetworks();

  const handleBurnerWalletSelect = async (privateKey: string) => {
    try {
      const burnerWallet = burnerWalletConfig({
        chains: targetNetworks,
        privateKey: privateKey as `0x${string}`,
      });

      const connector = burnerWallet.createConnector().connector;
      await connectAsync({ connector });
    } catch (error) {
      console.error("Failed to connect to burner wallet:", error);
    }
  };

  return (
    <>
      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          const connected = mounted && account && chain;
          const blockExplorerAddressLink = account
            ? getBlockExplorerAddressLink(targetNetwork, account.address)
            : undefined;

          return (
            <>
              {(() => {
                if (!connected) {
                  return (
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
                        Connect Wallet
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setIsBurnerModalOpen(true)}
                        type="button"
                      >
                        Burner Wallet
                      </button>
                    </div>
                  );
                }

                if (chain.unsupported || chain.id !== targetNetwork.id) {
                  return <WrongNetworkDropdown />;
                }

                return (
                  <>
                    <div className="flex flex-col items-center mr-1">
                      <Balance address={account.address as Address} className="min-h-0 h-auto" />
                      <span className="text-xs" style={{ color: networkColor }}>
                        {chain.name}
                      </span>
                    </div>
                    <AddressInfoDropdown
                      address={account.address as Address}
                      displayName={account.displayName}
                      ensAvatar={account.ensAvatar}
                      blockExplorerAddressLink={blockExplorerAddressLink}
                    />
                    <AddressQRCodeModal address={account.address as Address} modalId="qrcode-modal" />
                  </>
                );
              })()}
            </>
          );
        }}
      </ConnectButton.Custom>

      <BurnerWalletModal
        isOpen={isBurnerModalOpen}
        onClose={() => setIsBurnerModalOpen(false)}
        onSelectAccount={handleBurnerWalletSelect}
      />
    </>
  );
};

import { useState } from "react";
import { arbitrumNitro } from "~~/utils/scaffold-stylus/chain";

interface BurnerWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (privateKey: string) => void;
}

export const BurnerWalletModal = ({ isOpen, onClose, onSelectAccount }: BurnerWalletModalProps) => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAccountSelect = (privateKey: string, address: string) => {
    setSelectedAccount(address);
    onSelectAccount(privateKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Select Burner Wallet</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {arbitrumNitro.accounts.map((account, index) => (
            <button
              key={account.address}
              onClick={() => handleAccountSelect(account.privateKey, account.address)}
              className={`w-full p-3 text-left rounded-lg border transition-colors ${
                selectedAccount === account.address
                  ? "border-primary bg-primary/10"
                  : "border-base-300 hover:border-primary/50 hover:bg-base-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Account {index + 1}</div>
                  <div className="text-sm text-base-content/70 font-mono">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </div>
                </div>
                <div className="text-xs text-base-content/50">{account.address === selectedAccount ? "✓" : ""}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs text-base-content/60">
          These are predefined burner wallets for development. Select one to connect.
        </div>
      </div>
    </div>
  );
};

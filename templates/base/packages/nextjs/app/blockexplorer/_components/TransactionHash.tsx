"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

export const TransactionHash = ({ hash }: { hash: string }) => {
  const [addressCopied, setAddressCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setAddressCopied(true);
      setTimeout(() => {
        setAddressCopied(false);
      }, 800);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="flex items-center">
      <Link href={`/blockexplorer/transaction/${hash}`}>
        {hash?.substring(0, 6)}...{hash?.substring(hash.length - 4)}
      </Link>
      {addressCopied ? (
        <CheckCircleIcon
          className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
          aria-hidden="true"
        />
      ) : (
        <button onClick={handleCopy}>
          <DocumentDuplicateIcon
            className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
};

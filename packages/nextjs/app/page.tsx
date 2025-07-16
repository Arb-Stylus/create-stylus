"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useTheme } from "next-themes";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10 bg-base-100">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-Stylus</span>
          </h1>
          <div className="flex justify-center items-center space-x-2">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <p className="text-center text-lg">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/nextjs/app/page.tsx
            </code>
          </p>
          <p className="text-center text-lg">
            Edit your smart contract{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              lib.rs
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/stylus/src
            </code>
          </p>
        </div>

        <div className="flex-grow bg-base-100 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            {/* Debug Contracts Card */}
            <div
              className={`relative flex-1 bg-base-100 rounded-[40px] border-2 border-transparent p-4 text-center items-center flex flex-col max-w-md mx-auto ${
                isDarkMode ? "gradient-border-dark" : "gradient-border-light"
              }`}
              style={{
                boxShadow: "0 0 0 3px transparent",
              }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-3 bg-gradient-to-r from-[#3283EB] to-[#E3066E] rounded-t-[20px]" />
              <BugAntIcon className="h-14 w-14 mb-4 fill-[#E3066E] dark:fill-white" />
              <p className="text-base font-medium">
                Tinker with your smart contract using the
                <br />
                <Link href="/debug" passHref className="underline underline-offset-4 font-semibold text-lg">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            {/* Block Explorer Card */}
            <div
              className={`relative flex-1 bg-base-100 rounded-[40px] border-2 border-transparent p-4 text-center items-center flex flex-col max-w-md mx-auto ${
                isDarkMode ? "gradient-border-dark" : "gradient-border-light"
              }`}
              style={{
                boxShadow: "0 0 0 3px transparent",
              }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-3 bg-gradient-to-r from-[#3283EB] to-[#E3066E] rounded-t-[20px]" />
              <MagnifyingGlassIcon className="h-14 w-14 mb-4 fill-[#E3066E] dark:fill-white" />
              <p className="text-base font-medium">
                Explore your local transactions with the
                <br />
                <Link href="/blockexplorer" passHref className="underline underline-offset-4 font-semibold text-lg">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

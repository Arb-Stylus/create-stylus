import { defineChain } from "viem";

export const arbitrumNitro = defineChain({
  id: 412346,
  name: "Arbitrum Nitro",
  network: "arbitrum-nitro",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://localhost:8547"],
    },
    public: {
      http: ["http://localhost:8547"],
    },
  },
  accounts: [
    {
      privateKey: "0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659",
      address: "0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E",
    },
  ],
});

import { getRpcUrlFromViemChain } from "./utils";

function testNetworkFunctionality() {
  console.log("🧪 Testing network functionality...\n");
  
  const testNetworks = [
    "arbitrum",
    "arbitrumSepolia",
    "mainnet",  // alias for arbitrum
    "testnet",  // alias for arbitrumSepolia
    "invalid-network"
  ];
  
  testNetworks.forEach(network => {
    const rpcUrl = getRpcUrlFromViemChain(network);
    if (rpcUrl) {
      console.log(`✅ ${network}: ${rpcUrl}`);
    } else {
      console.log(`❌ ${network}: Not found in viem chains`);
    }
  });
  
  console.log("\n📝 Usage examples:");
  console.log("  NETWORK=arbitrum yarn deploy        # Deploy to Arbitrum One");
  console.log("  NETWORK=arbitrumSepolia yarn deploy # Deploy to Arbitrum Sepolia");
  console.log("  NETWORK=mainnet yarn deploy         # Deploy to Arbitrum One (alias)");
  console.log("  NETWORK=testnet yarn deploy         # Deploy to Arbitrum Sepolia (alias)");
}

if (require.main === module) {
  testNetworkFunctionality();
} 
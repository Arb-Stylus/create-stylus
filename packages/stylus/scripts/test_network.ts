import { getRpcUrlFromViemChain } from "./utils";

function testNetworkFunctionality() {
  console.log("🧪 Testing network functionality...\n");
  
  const testNetworks = [
    "mainnet",
    "sepolia", 
    "arbitrum",
    "arbitrumSepolia",
    "polygon",
    "polygonMumbai",
    "base",
    "baseSepolia",
    "optimism",
    "optimismSepolia",
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
  console.log("  NETWORK=polygon yarn deploy  # Deploy to Polygon");
  console.log("  NETWORK=base yarn deploy     # Deploy to Base");
}

if (require.main === module) {
  testNetworkFunctionality();
} 
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Givly = await hre.ethers.getContractFactory("Givly");
  const givly = await Givly.deploy();
  await givly.waitForDeployment();

  const address = await givly.getAddress();
  console.log("Givly deployed to:", address);

  const artifact = require("../artifacts/contracts/Givly.sol/Givly.json");
  const contractTs = `import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = '${address}';

export const ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
}
`;

  const outPath = path.resolve(__dirname, "../client/lib/contract.ts");
  fs.writeFileSync(outPath, contractTs);
  console.log("client/lib/contract.ts updated automatically");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

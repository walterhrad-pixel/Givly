const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const contractTs = fs.readFileSync(path.resolve(__dirname, "../client/lib/contract.ts"), "utf8");
  const match = contractTs.match(/CONTRACT_ADDRESS = '(0x[a-fA-F0-9]+)'/);
  const address = match[1];

  console.log("Redeploying fresh contract at:", address);

  const Givly = await hre.ethers.getContractFactory("Givly");
  const givly = await Givly.deploy();
  await givly.waitForDeployment();

  const newAddress = await givly.getAddress();
  console.log("Fresh contract deployed to:", newAddress);

  const artifact = require("../artifacts/contracts/Givly.sol/Givly.json");
  const contractTsNew = `import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = '${newAddress}';

export const ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
}
`;

  fs.writeFileSync(path.resolve(__dirname, "../client/lib/contract.ts"), contractTsNew);
  console.log("client/lib/contract.ts updated");
  console.log("All campaigns cleared. Visit /admin to create new ones.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

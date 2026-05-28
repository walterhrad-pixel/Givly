const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Givly = await hre.ethers.getContractFactory("Givly");
  const givly = await Givly.deploy();
  await givly.waitForDeployment();

  const address = await givly.getAddress();
  console.log("Givly deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

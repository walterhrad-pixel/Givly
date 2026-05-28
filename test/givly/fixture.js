const { ethers } = require("hardhat");

async function deployGivlyFixture() {
  const [owner, donor1, donor2, ngo, attacker] = await ethers.getSigners();

  const Givly = await ethers.getContractFactory("Givly");
  const givly = await Givly.deploy();
  await givly.waitForDeployment();

  return { givly, owner, donor1, donor2, ngo, attacker };
}

module.exports = { deployGivlyFixture };

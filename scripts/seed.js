const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [owner, ngo, donor1, donor2, donor3] = await hre.ethers.getSigners();

  const contractTs = fs.readFileSync(path.resolve(__dirname, "../client/lib/contract.ts"), "utf8");
  const match = contractTs.match(/CONTRACT_ADDRESS = '(0x[a-fA-F0-9]+)'/);
  const address = match[1];

  console.log("Seeding with contract:", address);

  const Givly = await hre.ethers.getContractFactory("Givly");
  const givly = Givly.attach(address);

  await givly.createCampaign(
    "Clean Water for Kisumu",
    "Providing clean water to 1000 families in Kisumu",
    ngo.address,
    hre.ethers.parseEther("3.0"),
    ["Drill borehole", "Install pipes", "Final delivery"],
    [hre.ethers.parseEther("1.0"), hre.ethers.parseEther("1.0"), hre.ethers.parseEther("1.0")]
  );
  console.log("Campaign 1 created");

  await givly.createCampaign(
    "School Renovation Nairobi",
    "Renovating 3 classrooms in Mathare primary school",
    ngo.address,
    hre.ethers.parseEther("4.0"),
    ["Purchase materials", "Construction", "Furnishing"],
    [hre.ethers.parseEther("2.0"), hre.ethers.parseEther("1.0"), hre.ethers.parseEther("1.0")]
  );
  console.log("Campaign 2 created");

  await givly.createCampaign(
    "Solar Power for Kibera Clinic",
    "Installing solar panels for a medical clinic in Kibera",
    ngo.address,
    hre.ethers.parseEther("5.0"),
    ["Equipment purchase", "Installation", "Testing and handover"],
    [hre.ethers.parseEther("3.0"), hre.ethers.parseEther("1.0"), hre.ethers.parseEther("1.0")]
  );
  console.log("Campaign 3 created");

  await givly.connect(donor1).donate(0, { value: hre.ethers.parseEther("0.5") });
  await givly.connect(donor2).donate(0, { value: hre.ethers.parseEther("0.3") });
  await givly.connect(donor3).donate(0, { value: hre.ethers.parseEther("0.2") });
  await givly.connect(donor1).donate(1, { value: hre.ethers.parseEther("1.0") });
  await givly.connect(donor2).donate(1, { value: hre.ethers.parseEther("0.5") });
  await givly.connect(donor1).donate(2, { value: hre.ethers.parseEther("2.0") });

  console.log("Donations seeded");
  console.log("Done! Visit http://localhost:3000");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

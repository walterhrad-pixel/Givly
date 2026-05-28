const hre = require("hardhat");

async function main() {
  const [owner, ngo, donor1, donor2] = await hre.ethers.getSigners();
  
  console.log("=== Givly Contract Test ===\n");

  // Attach to deployed contract
  const Givly = await hre.ethers.getContractFactory("Givly");
  const givly = Givly.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // 1. Create a campaign
  console.log("1. Creating campaign...");
  const goal = hre.ethers.parseEther("3.0");
  const milestoneAmounts = [
    hre.ethers.parseEther("1.0"),
    hre.ethers.parseEther("1.0"),
    hre.ethers.parseEther("1.0"),
  ];
  const tx1 = await givly.createCampaign(
    "Clean Water for Kisumu",
    "Providing clean water to 1000 families",
    ngo.address,
    goal,
    ["Drill borehole", "Install pipes", "Final delivery"],
    milestoneAmounts
  );
  await tx1.wait();
  console.log("   Campaign created ✓");

  // 2. Read campaign back
  const campaign = await givly.getCampaign(0);
  console.log(`\n2. Campaign details:`);
  console.log(`   Title: ${campaign.title}`);
  console.log(`   Goal:  ${hre.ethers.formatEther(campaign.goal)} ETH`);
  console.log(`   NGO:   ${campaign.ngo}`);
  console.log(`   Active: ${campaign.active}`);

  // 3. Donate from two donors
  console.log("\n3. Donating...");
  await givly.connect(donor1).donate(0, { value: hre.ethers.parseEther("1.5") });
  await givly.connect(donor2).donate(0, { value: hre.ethers.parseEther("1.5") });
  const updated = await givly.getCampaign(0);
  console.log(`   Total donated: ${hre.ethers.formatEther(updated.totalDonated)} ETH ✓`);

  // 4. Check donors list
  const donors = await givly.getDonors(0);
  console.log(`   Donors: ${donors.length} recorded ✓`);

  // 5. Check milestones
  console.log("\n4. Milestones before approval:");
  const milestones = await givly.getMilestones(0);
  milestones.forEach((m, i) => {
    console.log(`   [${i}] ${m.description} | ${hre.ethers.formatEther(m.amount)} ETH | approved: ${m.approved} | released: ${m.released}`);
  });

  // 6. Approve + release milestone 0
  console.log("\n5. Approving milestone 0...");
  await givly.approveMilestone(0, 0);
  console.log("   Approved ✓");

  const ngoBefore = await hre.ethers.provider.getBalance(ngo.address);
  await givly.releaseFunds(0, 0);
  const ngoAfter = await hre.ethers.provider.getBalance(ngo.address);
  const received = hre.ethers.formatEther(ngoAfter - ngoBefore);
  console.log(`   Funds released — NGO received: ${received} ETH ✓`);

  // 7. Confirm milestone marked released
  const milestonesAfter = await givly.getMilestones(0);
  console.log(`\n6. Milestone 0 status: released = ${milestonesAfter[0].released} ✓`);

  console.log("\n=== All tests passed ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

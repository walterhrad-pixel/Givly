const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployGivlyFixture, ethers } = require("./fixture");

describe("Givly - Creation", function () {
  it("owner can create campaign with milestones", async function () {
    const { givly, owner, ngo } = await loadFixture(deployGivlyFixture);

    const title = "Help Project";
    const description = "A test campaign";
    const milestoneDescs = ["M1", "M2"];
    const milestoneAmounts = [60, 40];
    const goal = 100;

    await expect(
      givly.connect(owner).createCampaign(title, description, ngo.address, goal, milestoneDescs, milestoneAmounts)
    ).not.to.be.reverted;

    const campaign = await givly.getCampaign(0);
    expect(campaign.id).to.equal(0n);
    expect(campaign.title).to.equal(title);
    expect(campaign.ngo).to.equal(ngo.address);
    expect(campaign.goal).to.equal(100n);
    expect(campaign.active).to.equal(true);

    const milestones = await givly.getMilestones(0);
    expect(milestones.length).to.equal(2);
    expect(milestones[0].amount).to.equal(60n);
  });

  it("reverts if milestone sums don't match goal", async function () {
    const { givly, owner, ngo } = await loadFixture(deployGivlyFixture);
    await expect(
      givly.connect(owner).createCampaign("t", "d", ngo.address, 100, ["m1"], [50])
    ).to.be.revertedWith("Milestone amounts must sum to goal");
  });

  it("reverts if no milestones provided or invalid NGO", async function () {
    const { givly, owner } = await loadFixture(deployGivlyFixture);
    await expect(
      givly.connect(owner).createCampaign("t", "d", ethers.ZeroAddress, 0, ["a"], [0])
    ).to.be.revertedWith("Invalid NGO address");
  });
});

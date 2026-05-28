const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployGivlyFixture } = require("./fixture");

describe("Givly - Voting", function () {
  async function setupCampaignWithDonations(fixture) {
    const { givly, owner, donor1, donor2, ngo, attacker } = fixture;

    await givly.connect(owner).createCampaign(
      "Help",
      "desc",
      ngo.address,
      100,
      ["m1", "m2"],
      [60, 40]
    );

    await givly.connect(donor1).donate(0, { value: 60 });
    await givly.connect(donor2).donate(0, { value: 40 });

    return { givly, donor1, donor2, ngo, attacker };
  }

  it("only donors can vote and vote weights are honored; auto-release on threshold", async function () {
    const fixture = await loadFixture(deployGivlyFixture);
    const { givly, donor1, donor2, ngo, attacker } = await setupCampaignWithDonations(fixture);

    await expect(givly.connect(attacker).voteOnMilestone(0, 0, true)).to.be.revertedWith("Only donors can vote");

    const ngoBalanceBefore = await ethers.provider.getBalance(ngo.address);

    await expect(givly.connect(donor1).voteOnMilestone(0, 0, true))
      .to.emit(givly, "VoteCast")
      .withArgs(0, 0, donor1.address, true);

    await expect(givly.connect(donor1).voteOnMilestone(0, 0, true)).to.be.revertedWith("Already voted");

    const ngoBalanceAfter = await ethers.provider.getBalance(ngo.address);
    expect(ngoBalanceAfter - ngoBalanceBefore).to.equal(60n);
  });
});

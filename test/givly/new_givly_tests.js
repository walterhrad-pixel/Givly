const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployGivlyFixture, ethers } = require("./fixture");

describe("Givly - Core Flows (new tests)", function () {
  it("createCampaign, getters and stages working", async function () {
    const { givly, owner, ngo } = await loadFixture(deployGivlyFixture);

    const title = "Help Project";
    const description = "A test campaign";
    const stageDescs = ["S1", "S2"];
    const stageAmounts = [60, 40];
    const goal = 100;

    await expect(
      givly.connect(owner).createCampaign(title, description, ngo.address, goal, stageDescs, stageAmounts)
    ).not.to.be.reverted;

    const campaign = await givly.getCampaign(0);
    expect(campaign.id).to.equal(0n);
    expect(campaign.title).to.equal(title);
    expect(campaign.ngo).to.equal(ngo.address);
    expect(campaign.goal).to.equal(100n);

    const stages = await givly.getStages(0);
    expect(stages.length).to.equal(2);
    expect(stages[0].amount).to.equal(60n);
  });

  it("donate updates donors and prevents zero-value donations", async function () {
    const { givly, owner, donor1 } = await loadFixture(deployGivlyFixture);

    await givly.connect(owner).createCampaign("c", "d", donor1.address, 10, ["s1"], [10]);

    await expect(givly.connect(donor1).donate(0, { value: 0 })).to.be.revertedWith("Donation must be > 0");

    await givly.connect(donor1).donate(0, { value: 10 });

    const amt = await givly.donorAmounts(0, donor1.address);
    expect(amt).to.equal(10n);

    const donors = await givly.getDonors(0);
    expect(donors.length).to.equal(1);
    expect(donors[0]).to.equal(donor1.address);
  });

  it("requestRelease reverts on insufficient balance and releases when funded", async function () {
    const { givly, owner, ngo, donor1 } = await loadFixture(deployGivlyFixture);

    await givly.connect(owner).createCampaign("c", "d", ngo.address, 50, ["s1"], [50]);

    // No donations yet -> insufficient balance
    await expect(givly.connect(ngo).requestRelease(0)).to.be.revertedWith("Insufficient balance");

    // Donate full amount and release
    await givly.connect(donor1).donate(0, { value: 50 });
    const contractBefore = await ethers.provider.getBalance(givly.target);

    await expect(givly.connect(ngo).requestRelease(0))
      .to.emit(givly, "StageReleased")
      .withArgs(0, 0, 50);

    const contractAfter = await ethers.provider.getBalance(givly.target);
    expect(contractBefore - contractAfter).to.equal(50n);
  });

  it("calling requestRelease too quickly freezes campaign and allows refunds after window", async function () {
    const { givly, owner, donor1, donor2, ngo } = await loadFixture(deployGivlyFixture);

    // Two-stage campaign
    await givly.connect(owner).createCampaign("c2", "d2", ngo.address, 100, ["a", "b"], [60, 40]);

    // Fund full goal
    await givly.connect(donor1).donate(0, { value: 60 });
    await givly.connect(donor2).donate(0, { value: 40 });

    // First release should succeed
    await expect(givly.connect(ngo).requestRelease(0)).to.emit(givly, "StageReleased");

    // Immediately requesting next release should freeze due to MIN_STAGE_INTERVAL
    await expect(givly.connect(ngo).requestRelease(0)).to.emit(givly, "CampaignFrozen");

    // Campaign is frozen; advance time past REFUND_WINDOW and claim refunds
    // REFUND_WINDOW is 30 days in contract; use that value
    const THIRTY_DAYS = 30 * 24 * 60 * 60;
    await time.increase(THIRTY_DAYS + 1);

    const contractBeforeRefund = await ethers.provider.getBalance(givly.target);
    await expect(givly.connect(donor1).claimRefund(0)).to.emit(givly, "RefundClaimed");
    const contractAfterRefund = await ethers.provider.getBalance(givly.target);
    expect(contractBeforeRefund - contractAfterRefund).to.be.greaterThan(0n);

    const status = await givly.getRefundStatus(0, donor1.address);
    expect(status.alreadyClaimed).to.equal(true);
  });
});

module.exports = {};

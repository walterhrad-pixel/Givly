const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployGivlyFixture } = require("./fixture");

describe("Givly - Views & Edge Cases", function () {
  it("getVoteStatus shows needed threshold and canRelease false before votes", async function () {
    const { givly, owner, donor1, ngo } = await loadFixture(deployGivlyFixture);
    await givly.connect(owner).createCampaign("c", "d", ngo.address, 100, ["m1"], [100]);
    await givly.connect(donor1).donate(0, { value: 10 });

    const status = await givly.getVoteStatus(0, 0);
    expect(status.threshold).to.equal(6n); // 10 * 60% = 6 (integer division)
    expect(status.canRelease).to.equal(false);
  });
});

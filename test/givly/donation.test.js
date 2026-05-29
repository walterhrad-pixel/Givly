const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployGivlyFixture } = require("./fixture");

describe("Givly - Donations", function () {
  async function setupCampaignWithDonations(fixture) {
    const { givly, owner, donor1, donor2, ngo } = fixture;

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

    return { givly, donor1, donor2 };
  }

  it("records donors and donations", async function () {
    const fixture = await loadFixture(deployGivlyFixture);
    const { givly, donor1, donor2 } = await setupCampaignWithDonations(fixture);

    const amt1 = await givly.donorAmounts(0, donor1.address);
    const amt2 = await givly.donorAmounts(0, donor2.address);
    expect(amt1).to.equal(60n);
    expect(amt2).to.equal(40n);

    const donors = await givly.getDonors(0);
    expect(donors.length).to.equal(2);
    expect(donors[0]).to.be.oneOf([donor1.address, donor2.address]);
  });
});

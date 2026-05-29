const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { deployGivlyFixture, ethers } = require("./fixture");

describe("Givly - forceRelease", function () {
  it("forceRelease only callable by owner and reverts on insufficient balance", async function () {
    const { givly, owner, donor1, ngo, attacker } = await loadFixture(deployGivlyFixture);

    await givly.connect(owner).createCampaign("c", "d", ngo.address, 50, ["m1"], [50]);

    await expect(givly.connect(attacker).forceRelease(0, 0)).to.be.reverted;

    await expect(givly.connect(owner).forceRelease(0, 0)).to.be.revertedWith("Insufficient balance");

    await givly.connect(donor1).donate(0, { value: 50 });
    const ngoBefore = await ethers.provider.getBalance(ngo.address);
    await expect(givly.connect(owner).forceRelease(0, 0)).to.emit(givly, "FundsReleased");
    const ngoAfter = await ethers.provider.getBalance(ngo.address);
    expect(ngoAfter - ngoBefore).to.equal(50n);
  });
});

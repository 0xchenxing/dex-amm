import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("SimpleGovernor E2E", function () {
  it("propose -> vote -> queue -> execute updates Factory.feeTo", async function () {
    const [deployer, v1, v2, v3, treasury] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SwapFactory");
    const factory = await Factory.deploy(deployer.address);
    await factory.deployed();

    const Governor = await ethers.getContractFactory("SimpleGovernor");
    const governor = await Governor.deploy(1, 5, 3, 60); // votingDelay, votingPeriod, quorum, minDelay
    await governor.deployed();

    await (await factory.setFeeToSetter(governor.address)).wait();

    const iface = new ethers.utils.Interface(["function setFeeTo(address)"]);
    const calldata = iface.encodeFunctionData("setFeeTo", [treasury.address]);

    await (await governor.connect(v1).propose([factory.address], [0], [calldata], "Set feeTo to treasury")).wait();
    await network.provider.send("evm_mine");

    await (await governor.connect(v1).castVote(1, true)).wait();
    await (await governor.connect(v2).castVote(1, true)).wait();
    await (await governor.connect(v3).castVote(1, true)).wait();

    for (let i = 0; i < 6; i++) await network.provider.send("evm_mine");
    expect(await governor.state(1)).to.equal(3); // Succeeded

    await (await governor.connect(v1).queue(1)).wait();
    expect(await governor.state(1)).to.equal(4); // Queued

    await network.provider.send("evm_increaseTime", [61]);
    await network.provider.send("evm_mine");

    await (await governor.connect(v1).execute(1)).wait();
    expect(await governor.state(1)).to.equal(5); // Executed
    expect(await factory.feeTo()).to.equal(treasury.address);
  });
});

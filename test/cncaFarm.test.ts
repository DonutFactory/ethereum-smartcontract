import { ethers } from "hardhat";
import chai, { expect, use} from "chai";
import { Contract, BigNumber } from "ethers";
import { solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { time } from "@openzeppelin/test-helpers";

describe("CncaFarm Contract", () => {

  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let res: any;
  let cncaFarm: Contract;
  let cncaToken: Contract;
  let mockERC20: Contract;

  const daiAmount: BigNumber = ethers.utils.parseEther("25000");

  beforeEach(async() => {
      const CncaFarm = await ethers.getContractFactory("CncaFarm");
      const CncaToken = await ethers.getContractFactory("CncaToken");
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      mockERC20 = await MockERC20.deploy("MockERC20", "ETH");
      [owner, alice, bob] = await ethers.getSigners();
      await Promise.all([
          mockERC20.mint(owner.address, daiAmount),
          mockERC20.mint(alice.address, daiAmount),
          mockERC20.mint(bob.address, daiAmount)
      ]);
      cncaToken = await CncaToken.deploy();
      cncaFarm = await CncaFarm.deploy(mockERC20.address, cncaToken.address);
  })

  describe("Init", async() => {
      it("should initialize", async() => {
          expect(cncaToken).to.be.ok
          expect(cncaFarm).to.be.ok
          expect(mockERC20).to.be.ok
      })
  })

  describe("Stake", async() => {
      it("should accept DAI and update mapping", async() => {
          let toTransfer = ethers.utils.parseEther("100")
          await mockERC20.connect(alice).approve(cncaFarm.address, toTransfer)

          expect(await cncaFarm.isStaking(alice.address))
              .to.eq(false)

          expect(await cncaFarm.connect(alice).stake(toTransfer))
              .to.be.ok

          expect(await cncaFarm.stakingBalance(alice.address))
              .to.eq(toTransfer)

          expect(await cncaFarm.isStaking(alice.address))
              .to.eq(true)
      })

      it("should update balance with multiple stakes", async() => {
          let toTransfer = ethers.utils.parseEther("100")
          await mockERC20.connect(alice).approve(cncaFarm.address, toTransfer)
          await cncaFarm.connect(alice).stake(toTransfer)

          await mockERC20.connect(alice).approve(cncaFarm.address, toTransfer)
          await cncaFarm.connect(alice).stake(toTransfer)

          expect(await cncaFarm.stakingBalance(alice.address))
              .to.eq(ethers.utils.parseEther("200"))
      })

      it("should revert with not enough funds", async() => {
          let toTransfer = ethers.utils.parseEther("1000000")
          await mockERC20.approve(cncaFarm.address, toTransfer)

          await expect(cncaFarm.connect(bob).stake(toTransfer))
              .to.be.revertedWith("You cannot stake zero tokens")
      })
  })

  describe("Unstake", async() => {
      beforeEach(async() => {
          let toTransfer = ethers.utils.parseEther("100")
          await mockERC20.connect(alice).approve(cncaFarm.address, toTransfer)
          await cncaFarm.connect(alice).stake(toTransfer)
      })

      it("should unstake balance from user", async() => {
          let toTransfer = ethers.utils.parseEther("100")
          await cncaFarm.connect(alice).unstake(toTransfer)

          res = await cncaFarm.stakingBalance(alice.address)
          expect(Number(res))
              .to.eq(0)

          expect(await cncaFarm.isStaking(alice.address))
              .to.eq(false)
      })
  })

  describe("WithdrawYield", async() => {

      beforeEach(async() => {
          await cncaToken._transferOwnership(cncaFarm.address)
          let toTransfer = ethers.utils.parseEther("10")
          await mockERC20.connect(alice).approve(cncaFarm.address, toTransfer)
          await cncaFarm.connect(alice).stake(toTransfer)
      })

      it("should return correct yield time", async() => {
          let timeStart = await cncaFarm.startTime(alice.address)
          expect(Number(timeStart))
              .to.be.greaterThan(0)

          // Fast-forward time
          await time.increase(86400)

          expect(await cncaFarm.calculateYieldTime(alice.address))
              .to.eq((86400))
      })

      it("should mint correct token amount in total supply and user", async() => {
          await time.increase(86400)

          let _time = await cncaFarm.calculateYieldTime(alice.address)
          let formatTime = _time / 86400
          let staked = await cncaFarm.stakingBalance(alice.address)
          let bal = staked * formatTime
          let newBal = ethers.utils.formatEther(bal.toString())
          let expected = Number.parseFloat(newBal).toFixed(3)

          await cncaFarm.connect(alice).withdrawYield()

          res = await cncaToken.totalSupply()
          let newRes = ethers.utils.formatEther(res)
          let formatRes = Number.parseFloat(newRes).toFixed(3).toString()

          expect(expected)
              .to.eq(formatRes)

          res = await cncaToken.balanceOf(alice.address)
          newRes = ethers.utils.formatEther(res)
          formatRes = Number.parseFloat(newRes).toFixed(3).toString()

          expect(expected)
              .to.eq(formatRes)
      })

      it("should update yield balance when unstaked", async() => {
          await time.increase(86400)
          await cncaFarm.connect(alice).unstake(ethers.utils.parseEther("5"))

          res = await cncaFarm.cncaBalance(alice.address)
          expect(Number(ethers.utils.formatEther(res)))
              .to.be.approximately(10, .001)
      })

  })


})
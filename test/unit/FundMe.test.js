const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
// const { describe, before, beforeEach } = require("node:test")

// Run test for local deploy
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let deployer
          let fundMe
          let mockV3Aggregator

          const sendValue = ethers.parseEther("1")

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              console.log(`deployer is : ${deployer}`)
              await deployments.fixture(["all"])

              let myContract = await deployments.get("FundMe")
              console.log(`fundme address is : ${myContract.address}`)
              fundMe = await ethers.getContractAt(
                  myContract.abi,
                  myContract.address,
              )

              myContract = await deployments.get("MockV3Aggregator")
              mockV3Aggregator = await ethers.getContractAt(
                  myContract.abi,
                  myContract.address,
              )
          })

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed()
                  console.log(response)
                  assert.equal(response, mockV3Aggregator.target)
              })
          })

          describe("fund", () => {
              // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html
              // could also do assert.fail
              it("Fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fundMe()).to.be.revertedWith(
                      "Didn't send enough!",
                  )
              })
              // we could be even more precise here by making sure exactly $50 works
              // but this is good enough for now
              it("Updates the amount funded data structure", async () => {
                  await fundMe.fundMe({ value: sendValue })
                  const response =
                      await fundMe.getAddressToAmountFunded(deployer)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of funders", async () => {
                  await fundMe.fundMe({ value: sendValue })
                  const response = await fundMe.getFunder(0)
                  assert.equal(response.toString(), deployer.toString())
              })
          })

          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fundMe({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const txnResponse = await fundMe.withdraw()
                  const txnReceipt = await txnResponse.wait()
                  const { gasUsed, gasPrice } = txnReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.target,
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance.toString(), "0")
                  assert.equal(
                      endingDeployerBalance + gasCost,
                      startingFundMeBalance + startingDeployerBalance,
                  )
              })

              // this test is overloaded. Ideally we'd split it into multiple tests
              // but for simplicity we left it as one
              it("is allows us to withdraw with multiple funders", async () => {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i],
                      )
                      await fundMeConnectedContract.fundMe({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.target)
                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  // Let's comapre gas costs :)
                  // const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, gasPrice } = transactionReceipt
                  const withdrawGasCost = gasUsed * gasPrice
                  console.log(`GasCost: ${withdrawGasCost}`)
                  console.log(`GasUsed: ${gasUsed}`)
                  console.log(`GasPrice: ${gasPrice}`)
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  // Assert
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + withdrawGasCost).toString(),
                  )
                  // Make a getter for storage variables
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address,
                          ),
                          0,
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1],
                  )
                  await expect(
                      fundMeConnectedContract.withdraw(),
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner")
              })
          })
      })

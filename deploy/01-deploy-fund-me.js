// deploy/00_deploy_my_contract.js
const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
require("dotenv").config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    // Get ethUsdPriceFeedAddress
    let ethUsdPriceFeedAddress
    const chainId = network.config.chainId
    // If we are on a development network, we need to use mocks.
    if (developmentChains.includes(network.name)) {
        const mockV3Aggragator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = mockV3Aggragator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log(`ethUsdPriceFeedAddress : ${ethUsdPriceFeedAddress}`)
    log("------------------------------------------")
    log("Depolying FundMe and waiting for confirmations...")
    const fundme = await deploy("FundMe", {
        contract: "FundMe",
        from: deployer,
        log: true,
        args: [ethUsdPriceFeedAddress],
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`FundMe deployed at ${fundme.address}`)
    // verify
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Should verify...")
        // await verify(fundme.address, [ethUsdPriceFeedAddress])
    }
}
module.exports.tags = ["all", "FundMe"]

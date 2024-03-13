const { ethers, getNamedAccounts } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContractAt("FundMe", deployer)
    let response = await ethers.provider.getStorage(fundMe.target, 0)
    console.log(response)
    response = await ethers.provider.getStorage(fundMe.target, 1)
    console.log(response)
    response = await ethers.provider.getStorage(fundMe.target, 2)
    console.log(response)
    response = await ethers.provider.getStorage(fundMe.target, 3)
    console.log(response)
    const mockV3Aggregator = await ethers.getContractAt(
        "MockV3Aggregator",
        deployer,
    )
    console.log(mockV3Aggregator.target)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

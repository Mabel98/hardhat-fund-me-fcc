require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("@nomicfoundation/hardhat-verify")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

/** @type import('hardhat/config').HardhatUserConfig */
const SEPOLIA_URL =
    process.env.SEPOLIA_URL ||
    "https://sepolia.infura.io/v3/a3d43bcd77e641a5b8d93a241905d620"
const PRIVATE_KEY =
    process.env.PRIVATE_KEY ||
    "0x11ee3108a03081fe260ecdc106554d09d9d1209bcafd46942b10e02943effc4a"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.6.6",
            },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://localhost:8545",
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
        customChains: [
            {
                network: "sepolia",
                chainId: 4,
                urls: {
                    apiURL: "http://api-sepolia.etherscan.io/api", // https => http
                    browserURL: "https://sepolia.etherscan.io",
                },
            },
        ],
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
            4: "0xA296a3d5F026953e17F472B497eC29a5631FB51B", // but for rinkeby it will be a specific address
            goerli: "0x84b9514E013710b9dD0811c9Fe46b837a4A0d8E0", //it can also specify a specific netwotk name (specified in hardhat.config.js)
        },
        feeCollector: {
            default: 1, // here this will by default take the second account as feeCollector (so in the test this will be a different account than the deployer)
            1: "0xa5610E1f289DbDe94F3428A9df22E8B518f65751", // on the mainnet the feeCollector could be a multi sig
            4: "0xa250ac77360d4e837a13628bC828a2aDf7BabfB3", // on rinkeby it could be another account
        },
    },
}

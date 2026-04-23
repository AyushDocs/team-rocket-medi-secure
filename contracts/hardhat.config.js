require("./tasks/seed-test");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      gasPrice: 20000000000,
      blockGasLimit: 60000000,
      allowUnlimitedContractSize: true,
      mining: {
        auto: true,
        interval: 0
      }
    },
    development: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      gasPrice: 20000000000,
    },
  },
};

require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.9",
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test",
  },
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/JU8kvb1Dozaa46lCSzGS99uUcCRv46px",
      accounts: [
        "429e5438078f99c07fefb922b7c9b207b684f157f9e9c28f159dc210f58ec8f0",
      ],
    },
  },
};

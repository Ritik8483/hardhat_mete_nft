async function main() {
  await ethers?.getSigners();
  const NFT = await ethers?.getContractFactory("NFT");
  const nft = await NFT.deploy();

  const Marketplace = await ethers?.getContractFactory("Marketplace");
  console.log("Marketplace : ",Marketplace);
  const marketplace = await Marketplace.deploy(1);
  console.log("marketplaceAddress",marketplace.address);
  saveFrontendFiles(nft, "NFT");
  saveFrontendFiles(marketplace, "Marketplace");
}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../frontend/contractsData";
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }
  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts?.readArtifactSync(name);
  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

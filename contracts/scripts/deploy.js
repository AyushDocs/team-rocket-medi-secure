const hre = require("hardhat");

async function main() {
    const MedSecure = await ethers.getContractFactory("MedSecure");
    const medSecure = await MedSecure.deploy();
    console.log("MedSecure deployed to:", medSecure.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

// scripts/deploy_upgradeable_box.js
const { ethers, upgrades } = require("hardhat");

async function main() {
    const Zapper = await ethers.getContractFactory("Zapper");

    const USDCAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
    const WETHAddress =  '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'; 
    const vaultAddress = '0xE4DB97A2AAFbfef40D1a4AE8B709f61d6756F8e1'; 


    console.log("Deploying Zapper...");
    const zapper = await Zapper.deploy(vaultAddress, USDCAddress, WETHAddress);
    await zapper.deployed();
    console.log('Zapper address: ',zapper.address)
}
main();

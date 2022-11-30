const { expect } = require("chai");
const { ethers} = require("hardhat");

const { toWei, fromWei } = require("./utils");

let Zapper, zapper, USDCContract, WETHContract, vaultContract, WMaticContract
let owner, account1 ,account2, account3, addressWithWMatic, accountWithWMatic       

before(async function () {
    Zapper = await ethers.getContractFactory("Zapper");
    [owner, account1, account2,account3] = await ethers.getSigners();

    addressWithWMatic = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [addressWithWMatic]
    });

    accountWithWMatic = await ethers.getSigner(addressWithWMatic);

    

    USDCContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174');
    WETHContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'); 
    WMaticContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270');   

    vaultContract = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", '0xE4DB97A2AAFbfef40D1a4AE8B709f61d6756F8e1'); 
    zapper = await Zapper.deploy(vaultContract.address,USDCContract.address,WETHContract.address);
    await zapper.deployed();

});

describe("User needs to have money in contract to withdraw", () => {
    it("User needs to have money in contract to withdraw", async function () {
        await expect(zapper.connect(account1).withdraw()).to.be.revertedWith("The user has to have money invested in the contract");
    })
});

describe("Check that user can buy beef", () => {


    it("Test can buy beefy token with matic", async function () {
        const valueBefore1 = await vaultContract.connect(account1).balanceOf(zapper.address);
        const amountOfBalanceOfUserBefore1 = await zapper.connect(account1).getAmountOfBalanceOfUser(account1.address);  
        await zapper.connect(account1).investMaticInVaultDirectly({value: toWei(10)});        
        const valueAfter1 = await vaultContract.connect(account1).balanceOf(zapper.address);
        const amountOfBalanceOfUserAfter1 = await zapper.connect(account1).getAmountOfBalanceOfUser(account1.address);  
        expect(fromWei(valueBefore1) < fromWei(valueAfter1));
        expect(fromWei(amountOfBalanceOfUserBefore1) < fromWei(amountOfBalanceOfUserAfter1));
    })

    it("Test can buy beefy token with wmatic", async function () {
        await WMaticContract.connect(accountWithWMatic).approve(zapper.address, toWei(100));
        const valueBefore2 = await vaultContract.connect(accountWithWMatic).balanceOf(zapper.address);
        const amountOfBalanceOfUserBefore2 = await zapper.connect(accountWithWMatic).getAmountOfBalanceOfUser(accountWithWMatic.address);  
        await zapper.connect(accountWithWMatic).investWMaticInVaultDirectly(toWei(10));        
        const valueAfter2 = await vaultContract.connect(accountWithWMatic).balanceOf(zapper.address);
        const amountOfBalanceOfUserAfter2 = await zapper.connect(accountWithWMatic).getAmountOfBalanceOfUser(accountWithWMatic.address);  
        expect(fromWei(valueBefore2) < fromWei(valueAfter2));
        expect(fromWei(amountOfBalanceOfUserBefore2) < fromWei(amountOfBalanceOfUserAfter2));
    })    

});

describe("Test that user can withdraw money form contract",() =>{
    it("Test can user can withdraw money from contract", async function () {
        await zapper.connect(account1).investMaticInVaultDirectly({value: toWei(10)});        
        const beefyInContractBeforeWithdraw = await vaultContract.connect(account1).balanceOf(zapper.address);
        const beefyOfUserBeforeWithdraw = await zapper.connect(account1).getAmountOfBalanceOfUser(account1.address);  

        expect(fromWei(beefyInContractBeforeWithdraw) > 0).to.be.equal(true);
        expect(fromWei(beefyOfUserBeforeWithdraw) > 0).to.be.equal(true);

        await zapper.connect(account1).withdraw();

        const beefyInContractAfterWithdraw = await vaultContract.connect(account1).balanceOf(zapper.address);
        const beefyOfUserAfterWithdraw = await zapper.connect(account1).getAmountOfBalanceOfUser(account1.address);         
        expect(fromWei(beefyInContractAfterWithdraw) == 0);
        expect(fromWei(beefyOfUserAfterWithdraw) == 0);
    })    

    it("Test that user gets his tokens after that he withdraws", async () => {
        await zapper.connect(account1).investMaticInVaultDirectly({value: toWei(10)});        
        const WMaticOfUserBeforeWithdraw = await WMaticContract.connect(account1).balanceOf(account1.address);
        await zapper.connect(account1).withdraw();     
        const WMaticOfUserAfterWithdraw = await WMaticContract.connect(account1).balanceOf(account1.address);  
        expect(fromWei(WMaticOfUserBeforeWithdraw) < fromWei(WMaticOfUserAfterWithdraw)); 
    })
})

describe("Check that zapper does not keep tokens of user", () => {


    it("Test can contract does not keep tokens when user buys with Matic", async function () {
        await zapper.connect(account1).investMaticInVaultDirectly({value: toWei(10)});   
        const amountOfUSDCOfContractAfterBuy = await USDCContract.connect(account1).balanceOf(zapper.address);
        const amountOfWETHOfContractAfterBuy = await WETHContract.connect(account1).balanceOf(zapper.address);     
        expect(amountOfUSDCOfContractAfterBuy).to.be.equal('0');
        expect(amountOfWETHOfContractAfterBuy).to.be.equal('0');
    })

    it("Test can contract does not keep tokens when user buys with WMatic", async function () {
        await WMaticContract.connect(accountWithWMatic).approve(zapper.address, toWei(100));
        await zapper.connect(accountWithWMatic).investWMaticInVaultDirectly(toWei(10));        
        const amountOfUSDCOfContractAfterBuy = await USDCContract.connect(accountWithWMatic).balanceOf(zapper.address);
        const amountOfWETHOfContractAfterBuy = await WETHContract.connect(accountWithWMatic).balanceOf(zapper.address);     
        expect(amountOfUSDCOfContractAfterBuy).to.be.equal('0');
        expect(amountOfWETHOfContractAfterBuy).to.be.equal('0');        
    })

});
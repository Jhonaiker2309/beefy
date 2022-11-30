require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");


module.exports = {
	networks: {
		hardhat: {
			forking: {
				url: process.env.ALCHEMY_KEY_POLYGON,
				blockNumber: 36251474,
			},
			chainId: 137,
		},
		polygon: {
			url: process.env.ALCHEMY_KEY_POLYGON,
			accounts: [process.env.ACCOUNT_KEY]
		},
	},
	gas: 'auto',
	namedAccounts: {
		deployer: 0,
		feeRecipient: 1,
		user: 2,
	},
	solidity: {
		version: "0.8.7",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	mocha: {
		timeout: 240000,
	},
};
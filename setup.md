# Environment Setup/Dependencies

Let’s start with opening up your code editor and creating a new directory. For this project, I named mine pmkn-farm (yes, I’m farming PMKN). Make sure you have Node installed (or Yarn, if you prefer).

In the code editor terminal (I’m using a Mac), cd into your farm directory. Then, install the following dependencies (following Hardhat’s TypeScript configuration with some additions):
> npm i --save-dev hardhat

Open up Hardhat with npx hardhat
Scroll one item down to Create an empty hardhat.config.js

Next, we need to install dependencies for TypeScript. Run the following:
> npm i --save-dev ts-node typescript

And for testing:
> npm i --save-dev chai @types/node @types/mocha @types/chai

Next, we’ll be using an ERC20 token as both the staking token and as the yield rewarded to users. OpenZeppelin hosts numerous libraries out of convenience for developers. They also offer excellent testing tools. During testing, we’ll need to simulate the passing of time. Let’s grab everything here:
> npm i --save-dev @openzeppelin/contracts @openzeppelin/test-helpers

We’ll also need this for OpenZeppelin’s time.increase() function:
> npm i --save-dev @nomiclabs/hardhat-web3 @nomiclabs/hardhat-waffle

Next, if you plan on posting your work on GitHub or anywhere else outside of your local environment, you’ll need dotenv:
> npm i --save-dev dotenv

Change the hardhat.config to TypeScript:
> mv hardhat.config.js hardhat.config.ts

Finally, we’ll change the Solidity version and reformat the hardhat-waffle import and include the hardhat-web3 import in the hardhat.config.ts:


### Deploy Contract
> npx hardhat run scripts/deploy.ts --network rinkeby

Deploying contracts with the account: 0x1506d52b4d2Af89A7648Cc2d3F82ecc38F05081C
Account balance: 5022258734381092174
Contract deployed at: 0x098EA5B76d4Bb79f78C2AACD5D7eA7c131fB73a7

### Verify Contract
> npx hardhat verify --network rinkeby 0x098EA5B76d4Bb79f78C2AACD5D7eA7c131fB73a7 "0x1506d52b4d2Af89A7648Cc2d3F82ecc38F05081C" "0x1506d52b4d2Af89A7648Cc2d3F82ecc38F05081C"

Nothing to compile
Compiling 1 file with 0.8.4
Successfully submitted source code for contract
contracts/CncaFarm.sol:CncaFarm at 0x098EA5B76d4Bb79f78C2AACD5D7eA7c131fB73a7
for verification on Etherscan. Waiting for verification result...

Successfully verified contract CncaFarm on Etherscan.
https://rinkeby.etherscan.io/address/0x098EA5B76d4Bb79f78C2AACD5D7eA7c131fB73a7#code
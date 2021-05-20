import Web3 from 'web3';
import {IAccount, IState} from './interfaces/basic.interface';
import {createTraderPoolTx} from './utils/createTraderPoolTx';
import ganacheCore from 'ganache-core';
import Ganache from 'ganache-core';
import path from "path";
import {swapTokens} from './utils/swapTokens';

const ganacheOptions: Ganache.IProviderOptions = {
    account_keys_path: path.resolve(__dirname, 'accounts.json'),
    fork: 'https://bsc-dataseed1.binance.org',
    networkId: 56,
    hardfork: 'istanbul',
    blockTime: 3,
    default_balance_ether: 10000,
    total_accounts: 101,
}

const provider = ganacheCore.provider(ganacheOptions);
// @ts-ignore
const accounts: IAccount[] = Object.values(provider.manager.state.accounts);
const traderAccount: IAccount = accounts[0];

const state: IState = {
    config: {
        walletAddress : traderAccount.address,
        privateKey : traderAccount.secretKey,
        gasPrice : 20000000000,
        gasLimit : 6721975,
        busdTokenAddress : '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', //busd
    },
    // @ts-ignore
    web3: new Web3(provider, null, { transactionConfirmationBlocks: 1 }),
    accounts: accounts,
    abiPET : require('./abi/PancakeExchangeTool.json'),
    abiTPFU : require('./abi/TraderPoolFactoryUpgradeable.json'),
    abiPancake: require('./abi/PancakeSwapRouterV2.json'),
    pancakeExchangeToolAddress : '0x08dc8aDf813778455Bd478fb94057531094EBDD5',
    traderPoolFactoryUpgradeableAddress : '0x4325096FA184a2775083914DA57eB2ebBc4e8C46',
    pancakeRouterAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
}

async function run() {
    await createTraderPoolTx(state);
    await swapTokens(state);
}

setInterval(() => {
}, 10000)

run();

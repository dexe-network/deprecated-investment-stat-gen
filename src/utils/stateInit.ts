import {IAccount, IState} from '../interfaces/basic.interface';
import Web3 from 'web3';
import GanacheCore from 'ganache-core';
import {basicTokensAddress} from '../constant/basicTokenList';

export function stateInitializer(provider: GanacheCore.Provider): IState {
    // @ts-ignore
    const accounts: IAccount[] = Object.values(provider.manager.state.accounts);

    const state: IState = {
        config: {
            gasPrice : 20000000000,
            gasLimit : 6721975,
        },
        // @ts-ignore
        web3: new Web3(provider, null, { transactionConfirmationBlocks: 1 }),
        accounts: {
            all: accounts,
            traders: accounts.slice(0, 5),
            users: accounts.slice(21, 22)
        },
        abis: {
            abiPET : require('../abi/PancakeExchangeTool.json'),
            abiTPFU : require('../abi/TraderPoolFactoryUpgradeable.json'),
            abiPancake: require('../abi/PancakeSwapRouterV2.json'),
            abiTraderPool: require('../abi/TraderPool.json'),
            abiErc20: require('../abi/ERC20.json'),
            abiPancakeFactory: require('../abi/IUniswapV2Factory.json'),
            abiPairContract: require('../abi/IPancakePair.json'),
        },
        baseAddresses: {
            pancakeExchangeTool : '0x08dc8aDf813778455Bd478fb94057531094EBDD5',
            traderPoolFactoryUpgradeable : '0x4325096FA184a2775083914DA57eB2ebBc4e8C46',
            pancakeSwapRouterV2: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
            pancakeFactory: '0xBCfCcbde45cE874adCB698cC183deBcF17952812',
        },
        traderPools: [],
        baseTokenList: basicTokensAddress,
    }

    return state;
}

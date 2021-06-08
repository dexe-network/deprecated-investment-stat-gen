import { IAccount, IState, VENDOR } from '../interfaces/basic.interface';
import Web3 from 'web3';
import GanacheCore from 'ganache-core';
import { basicBscTokensAddress, bscSwapTokenList } from '../constant/basicTokenList';

export function stateInitializer(provider: GanacheCore.Provider): IState {
  // @ts-ignore
  const accounts: IAccount[] = Object.values(provider.manager.state.accounts);

  const state: IState = {
    config: {
      //@ts-ignore
      gasPrice: Web3.utils.hexToNumber(provider.options.gasPrice),
      //@ts-ignore
      gasLimit: Web3.utils.hexToNumber(provider.options.gasLimit),
    },
    // @ts-ignore
    web3: new Web3(provider, null, { transactionConfirmationBlocks: 1 }),
    vendor: VENDOR.BSC,
    provider,
    accounts: {
      all: accounts,
      traders: accounts.slice(0, 1),
      users: accounts.slice(21, 25),
    },
    abis: {
      abiPET: require('../abi/PancakeExchangeTool.json'),
      abiTPFU: require('../abi/TraderPoolFactoryUpgradeable.json'),
      abiPancake: require('../abi/PancakeSwapRouterV2.json'),
      abiTraderPool: require('../abi/TraderPoolUpgradeable.json'),
      abiErc20: require('../abi/ERC20.json'),
      abiPancakeFactory: require('../abi/IUniswapV2Factory.json'),
      abiPairContract: require('../abi/IPancakePair.json'),
      abiParamKeeper: require('../abi/ParamKeeper.json'),
    },
    addressData: {
      baseAddresses: {
        defiSwapRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        defiFactory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      },
      deployedAddresses: {
        exchangeTool: '',
        traderPoolFactoryUpgradeable: '',
      },
      traderPools: [],
      baseTokenList: basicBscTokensAddress,
      swapTokenList: bscSwapTokenList,
    },
  };

  return state;
}

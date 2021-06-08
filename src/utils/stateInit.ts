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
    contracts: {
      exchangeTool: require('../contracts/PancakeExchangeTool.json'),
      traderPoolFactory: require('../contracts/TraderPoolFactoryUpgradeable.json'),
      swapRouterV2: require('../contracts/IPancakeRouter02.json'),
      traderPool: require('../contracts/TraderPoolUpgradeable.json'),
      erc20: require('../contracts/ERC20.json'),
      swapFactory: require('../contracts/IUniswapV2Factory.json'),
      pairContract: require('../contracts/IPancakePair.json'),
      paramKeeper: require('../contracts/ParamKeeper.json'),
      upgradeableBeacon: require('../contracts/UpgradeableBeacon.json'),
      beaconProxy: require('../contracts/BeaconProxy.json'),
      poolLiquidityTokenUpgradeable: require('../contracts/PoolLiquidityTokenUpgradeable.json'),
      pathFinder: require('../contracts/PancakePathFinder.json'),
      autoExchangeTool: require('../contracts/UniswapAutoExchangeTool.json'),
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

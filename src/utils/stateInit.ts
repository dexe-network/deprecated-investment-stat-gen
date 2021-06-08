import { IAccount, IState, VENDOR } from '../interfaces/basic.interface';
import Web3 from 'web3';
import GanacheCore from 'ganache-core';
import { basicEthereumTokensAddress, ethereumSwapTokenList } from '../constant/basicTokenList';

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
    vendor: VENDOR.Ethereum,
    provider,
    accounts: {
      all: accounts,
      traders: accounts.slice(0, 1),
      users: accounts.slice(21, 25),
    },
    contracts: {
      exchangeTool: require('../contracts/UniswapExchangeTool.json'),
      traderPoolFactory: require('../contracts/TraderPoolFactoryUpgradeable.json'),
      swapRouterV2: require('../contracts/IUniswapV2Router02.json'),
      traderPool: require('../contracts/TraderPoolUpgradeable.json'),
      erc20: require('../contracts/ERC20.json'),
      swapFactory: require('../contracts/IUniswapV2Factory.json'),
      pairContract: require('../contracts/IUniswapV2Pair.json'),
      paramKeeper: require('../contracts/ParamKeeper.json'),
      upgradeableBeacon: require('../contracts/UpgradeableBeacon.json'),
      beaconProxy: require('../contracts/BeaconProxy.json'),
      poolLiquidityTokenUpgradeable: require('../contracts/PoolLiquidityTokenUpgradeable.json'),
      pathFinder: require('../contracts/UniswapPathFinder.json'),
      autoExchangeTool: require('../contracts/UniswapAutoExchangeTool.json'),
    },
    addressData: {
      baseAddresses: {
        defiSwapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        defiFactory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      },
      deployedAddresses: {
        exchangeTool: '',
        traderPoolFactoryUpgradeable: '',
      },
      traderPools: [],
      baseTokenList: basicEthereumTokensAddress,
      swapTokenList: ethereumSwapTokenList,
    },
  };

  return state;
}

import Web3 from 'web3';
import GanacheCore from 'ganache-core';

export interface IState {
  config: IConfig;
  web3: Web3;
  vendor: VENDOR;
  provider: GanacheCore.Provider;
  contracts: {
    exchangeTool: IContract;
    traderPoolFactory: IContract;
    swapRouterV2: IContract;
    traderPool: IContract;
    erc20: IContract;
    swapFactory: IContract;
    pairContract: IContract;
    paramKeeper: IContract;
    upgradeableBeacon: IContract;
    beaconProxy: IContract;
    poolLiquidityTokenUpgradeable: IContract;
    pathFinder: IContract;
    autoExchangeTool: IContract;
  };
  accounts: {
    all: IAccount[];
    traders: IAccount[];
    users: IAccount[];
  };
  timeRange: {
    startTime: Date;
    finishTime: Date;
  };
  operationsInfo: IOperationsInfo;
  addressData: IAddressData;
}

export interface IOperationsInfo {
  investorDeposits: {
    walletAddress: string;
    traderPool: IPoolInfo;
    amount: number;
  }[];
}

export interface IAddressData {
  baseAddresses: {
    defiSwapRouter: string;
    defiFactory: string;
  };
  deployedAddresses: {
    traderPoolFactoryUpgradeable: string;
    exchangeTool: string;
  };
  traderPools: IPoolInfo[];
  baseTokenList: string[];
  swapTokenList: string[];
  wethOrWbnbAddress: string;
}

export enum VENDOR {
  Ethereum,
  BSC,
}

export interface IPoolInfo {
  traderName: string;
  traderWallet: string;
  basicToken: string;
  poolAddress: string;
}

export interface IConfig {
  gasPrice: number;
  gasLimit: number;
}

export interface IAccount {
  secretKey: Buffer;
  publicKey: Buffer;
  address: string;
}

export interface IRawTransaction {
  from: string;
  nonce: string;
  gasPrice: string;
  gasLimit: string;
  to: string;
  value: string;
  data: string;
}

export interface IContractTokenNames {
  token0: string;
  token1: string;
}

export interface ITokenPriceData {
  sendToken: {
    address: string;
    reserve: string;
    decimals: number;
  };
  receiveToken: {
    address: string;
    reserve: string;
    decimals: number;
  };
}

export interface IReserveData {
  reserve0: string;
  reserve1: string;
  blockTimestampLast: string;
}

export interface IContract {
  abi: any;
  bytecode: any;
  contractName: string;
}

export interface IPosition {
  amountOpened: string; // the amount of Basic Tokens a position was opened with.
  liquidity: string; // the amount of Destination tokens received from exchange when position was opened.
  token: string; // token - the address of ERC20 token that position was opened to
  // i.e. the position was opened with  "amountOpened" of BasicTokens and resulted in "liquidity" amount of "token"s.
}

import Web3 from 'web3';
import GanacheCore from 'ganache-core';

export interface IState {
  config: IConfig;
  web3: Web3;
  vendor: VENDOR;
  provider: GanacheCore.Provider;
  abis: {
    abiPET: any;
    abiTPFU: any;
    abiPancake: any;
    abiTraderPool: any;
    abiErc20: any;
    abiPancakeFactory: any;
    abiPairContract: any;
    abiParamKeeper: any;
  };
  accounts: {
    all: IAccount[];
    traders: IAccount[];
    users: IAccount[];
  };
  addressData: IAddressData;
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
  };
  receiveToken: {
    address: string;
    reserve: string;
  };
}

export interface IReserveData {
  reserve0: string;
  reserve1: string;
  blockTimestampLast: string;
}

export interface IPosition {
  amountOpened: string; // the amount of Basic Tokens a position was opened with.
  liquidity: string; // the amount of Destination tokens received from exchange when position was opened.
  token: string; // token - the address of ERC20 token that position was opened to
  // i.e. the position was opened with  "amountOpened" of BasicTokens and resulted in "liquidity" amount of "token"s.
}

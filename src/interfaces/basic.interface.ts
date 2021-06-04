import Web3 from 'web3';

export interface IState {
  config: IConfig;
  web3: Web3;
  vendor: VENDOR;
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

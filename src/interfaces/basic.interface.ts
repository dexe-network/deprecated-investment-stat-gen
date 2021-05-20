import Web3 from 'web3';

export interface IState {
    config: IConfig;
    web3: Web3;
    abis: {
        abiPET: any;
        abiTPFU: any;
        abiPancake: any;
        abiTraderPool: any;
        abiErc20: any;
    }
    accounts: IAccount[];
    pancakeExchangeToolAddress: string;
    traderPoolFactoryUpgradeableAddress: string;
    pancakeRouterAddress: string;
    traderPools: IPoolInfo[];
}

export interface IPoolInfo {
    traderName: string;
    traderWallet: string;
    basicToken: string;
    poolAddress: string;
}

export interface IConfig {
    walletAddress: string,
    privateKey: Buffer,
    gasPrice: number,
    gasLimit: number,
    busdTokenAddress: string, //busd
}

export interface IAccount {
    secretKey: Buffer;
    publicKey: Buffer;
    address: string;
}

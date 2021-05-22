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
        abiPancakeFactory: any;
        abiPairContract: any;
    }
    accounts: {
        all: IAccount[],
        traders: IAccount[],
        users: IAccount[],
    };
    baseAddresses: {
        pancakeExchangeTool: string;
        traderPoolFactoryUpgradeable: string;
        pancakeSwapRouterV2: string;
        pancakeFactory: string;
    }
    traderPools: IPoolInfo[];
    baseTokenList: string[];
}

export interface IPoolInfo {
    traderName: string;
    traderWallet: string;
    basicToken: string;
    poolAddress: string;
}

export interface IConfig {
    gasPrice: number,
    gasLimit: number,
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

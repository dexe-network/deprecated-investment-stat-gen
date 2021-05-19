import Web3 from 'web3';

export interface IState {
 config: IConfig;
 web3: Web3;
 abiPET : any;
 abiTPFU : any;
 accounts: IAccount[];
 pancakeExchangeToolAddress : string;
 traderPoolFactoryUpgradeableAddress : string;
}

export interface IConfig {
    walletAddress : string,
    privateKey : Buffer,
    gasPrice : number,
    gasLimit : number,
    basicTokenAddress : string, //busd
}

export interface IAccount {
    secretKey: Buffer;
    publicKey: Buffer;
    address: string;
}
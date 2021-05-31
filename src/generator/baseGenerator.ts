import {IPoolInfo, IState} from '../interfaces/basic.interface';
import {BaseOperation} from '../operation/baseOperation';
import lodash from 'lodash';
import {basicBscTokensAddress} from '../constant/basicTokenList';
import 'colors';
import fs from 'fs';
import path from "path";
import {loadData, storeData} from '../helpers/fileSystem.helper';

export class BaseGenerator {
    baseOperation: BaseOperation = new BaseOperation(this.state);
    isNewBD = false;

    constructor(private state: IState) {
        if (!fs.existsSync(path.resolve(__dirname,'../db'))) {
            this.isNewBD = true;
        }
    }

    async run(): Promise<void> {
        try {
            if (this.isNewBD) {
                await this.generateTraderPools();
            } else {
                console.log('DB already exist'.bgGreen.bold)
                console.log('generateTraderPools skipped'.bgYellow.bold)
                this.loadTraderPoolData();
                console.log('Trader Pool Data was Loaded'.bgCyan.bold)
            }
        } catch (e) {
            throw e;
        }
    }

    async generateTraderPools(): Promise<void> {
        const tradersList = this.state.accounts.traders;
        const usersList = this.state.accounts.users;

        // Create Trader Pools
        console.log('Create Trader Pools'.bgGreen.bold)
        await Promise.all(tradersList.map(async value => {
            await this.baseOperation.createTraderPoolTx(value, lodash.sample(basicBscTokensAddress));
        }))
        const traderPools = this.state.traderPools;
        this.saveTraderPoolData(traderPools);
        console.log('Creating Pools Completed'.bgGreen.bold)
        //=====================


        // Deposit From Traders
        console.log('Deposit From Traders'.bgGreen.bold)
        await Promise.all(traderPools.map(async value => {
            const traderAccount = tradersList.find(x => x.address.toLowerCase() === value.traderWallet.toLowerCase());
            await this.baseOperation.depositTokenToTraderPool(traderAccount, value, lodash.random(1, 3) * 1000);
        }))
        console.log('Deposit From Traders Completed'.bgGreen.bold)
        //=======================

        // Deposit From Users
        console.log('Deposit From Users'.bgGreen.bold)
        await Promise.all(usersList.map(async value => {
            await this.baseOperation.depositTokenToTraderPool(value, lodash.sample(traderPools), lodash.random(1, 3) * 1000);
        }))
        console.log('Deposit From Users Completed'.bgGreen.bold)
        //=====================
    }

    saveTraderPoolData(traderPools: IPoolInfo[]): void {
        storeData(traderPools, path.resolve(__dirname,'../db', 'traderPools.json'));
    }

    loadTraderPoolData(): void {
        this.state.traderPools = loadData<IPoolInfo[]>(path.resolve(__dirname,'../db', 'traderPools.json'));
    }
}

import {IState} from '../interfaces/basic.interface';
import {BaseOperation} from '../operation/baseOperation';
import lodash from 'lodash';
import {basicTokensAddress} from '../constant/basicTokenList';
import colors from 'colors/safe';

export class BaseGenerator {
    baseOperation: BaseOperation = new BaseOperation(this.state);

    constructor(private state: IState) {
    }

    async run(): Promise<void> {
        try {
            await this.generateTraderPools();
        } catch (e) {
            throw e;
        }
    }

    async generateTraderPools(): Promise<void> {
        const tradersList = this.state.accounts.traders;
        const usersList = this.state.accounts.users;

        // Create Trader Pools
        //@ts-ignore
        console.log(colors.bgGreen.bold('Create Trader Pools'))
        await Promise.all(tradersList.map(async value => {
            await this.baseOperation.createTraderPoolTx(value, lodash.sample(basicTokensAddress));
        }))
        const traderPools = this.state.traderPools;
        //@ts-ignore
        console.log(colors.bgGreen.bold('Creating Pools Completed'))
        //=====================


        // Deposit From Traders
        //@ts-ignore
        console.log(colors.bgGreen.bold('Deposit From Traders'))
        await Promise.all(traderPools.map(async value => {
            const traderAccount = tradersList.find(x => x.address.toLowerCase() === value.traderWallet.toLowerCase());
            await this.baseOperation.depositTokenToTraderPool(traderAccount, value, lodash.random(1, 3) * 1000);
        }))
        //@ts-ignore
        console.log(colors.bgGreen.bold('Deposit From Traders Completed'))
        //=======================

        // Deposit From Users
        //@ts-ignore
        console.log(colors.bgGreen.bold('Deposit From Users'))
        await Promise.all(usersList.map(async value => {
            await this.baseOperation.depositTokenToTraderPool(value, lodash.sample(traderPools), lodash.random(1, 3) * 1000);
        }))
        //@ts-ignore
        console.log(colors.bgGreen.bold('Deposit From Users Completed'))
        //=====================
    }
}

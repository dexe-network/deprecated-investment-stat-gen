import { IAddressData, IOperationsInfo, IPoolInfo, IState } from '../interfaces/basic.interface';
import { BaseOperation } from '../operation/baseOperation';
import lodash from 'lodash';
import 'colors';
import fs from 'fs';
import path from 'path';
import { loadData, storeData } from '../helpers/fileSystem.helper';
import { DeployContracts } from '../operation/deployContracts';
import moment from 'moment';

export class BaseGenerator {
  baseOperation: BaseOperation = new BaseOperation(this.state);
  deployContracts: DeployContracts = new DeployContracts(this.state);
  isNewBD = false;
  operationCounter = 0;

  constructor(private state: IState) {
    if (!fs.existsSync(path.resolve(__dirname, '../db'))) {
      this.isNewBD = true;
    }
  }

  async run(): Promise<void> {
    try {
      // await this.deployContracts.run();
      // await this.generateTraderPools();
      // console.log('Start Endless trading operations'.bgYellow.bold);
      // void this.runRandomOperations();

      if (this.isNewBD) {
        await this.deployContracts.run();
        await this.generateTraderPools();
        this.saveStateData(this.state);
        console.log('Start Endless trading operations'.bgYellow.bold);
        void this.runRandomOperations();
      } else {
        console.log('DB already exist'.bgGreen.bold);
        console.log('generateTraderPools skipped'.bgYellow.bold);
        this.loadStateData();
        console.log('Trader Pool Data was Loaded'.bgCyan.bold);

        console.log('Start Endless trading operations'.bgYellow.bold);
        void this.runRandomOperations();
      }
    } catch (e) {
      throw e;
    }
  }

  async runRandomOperations(): Promise<void> {
    // const rand = lodash.random(3, 10) * 100;
    const rand = 0;
    const operation = lodash.sample([1, 2, 3, 4]);
    setTimeout(async () => {
      this.operationCounter++;
      switch (operation) {
        case 1: {
          console.log('Operation openPosition'.bgGreen.bold, this.operationCounter);
          await this.baseOperation.openPosition(lodash.sample(this.state.addressData.traderPools));
          break;
        }
        case 2: {
          console.log('Operation closePosition'.bgGreen.bold, this.operationCounter);
          await this.baseOperation.closePosition(lodash.sample(this.state.addressData.traderPools));
          break;
        }
        case 3: {
          console.log('Operation Deposit'.bgGreen.bold, this.operationCounter);
          await this.baseOperation.depositTokenToTraderPool(
            lodash.sample(this.state.accounts.users),
            lodash.sample(this.state.addressData.traderPools),
            lodash.random(1, 3) * 100,
          );
          break;
        }
        case 4: {
          console.log('Operation Withdraw'.bgGreen.bold, this.operationCounter);
          const randomIndex = lodash.random(0, this.state.operationsInfo.investorDeposits.length - 1);
          const randomItem = this.state.operationsInfo.investorDeposits[randomIndex];
          const account = this.state.accounts.all.find(x => x.address === randomItem.walletAddress);
          this.state.operationsInfo.investorDeposits.splice(randomIndex, 1);

          await this.baseOperation.withdrawTokenFromTraderPool(account, randomItem.traderPool, randomItem.amount);
          break;
        }
        default: {
          throw new Error('Wrong Operation Number');
        }
      }
      console.log('RANGE', await this.timeRange());
      if (await this.timeRange()) {
        void this.runRandomOperations();
      }
    }, rand);
  }

  async generateTraderPools(): Promise<void> {
    const tradersList = this.state.accounts.traders;
    const usersList = this.state.accounts.users;

    // Create Trader Pools
    console.log('Create Trader Pools'.bgGreen.bold);
    await Promise.all(
      tradersList.map(async value => {
        await this.baseOperation.createTraderPoolTx(value, lodash.sample(this.state.addressData.baseTokenList));
      }),
    );
    const traderPools = this.state.addressData.traderPools;
    console.log('Creating Pools Completed'.bgGreen.bold);
    //=====================

    // Deposit From Traders
    console.log('Deposit From Traders'.bgGreen.bold);
    await Promise.all(
      traderPools.map(async value => {
        const traderAccount = tradersList.find(x => x.address.toLowerCase() === value.traderWallet.toLowerCase());
        await this.baseOperation.depositTokenToTraderPool(traderAccount, value, lodash.random(1, 3) * 1000);
      }),
    );
    console.log('Deposit From Traders Completed'.bgGreen.bold);
    //=======================

    // Deposit From Users
    console.log('Deposit From Users'.bgGreen.bold);
    await Promise.all(
      usersList.map(async value => {
        const [account, traderPool, amount] = [value, lodash.sample(traderPools), lodash.random(1, 3) * 100];
        this.state.operationsInfo.investorDeposits.push({ walletAddress: account.address, traderPool, amount });
        await this.baseOperation.depositTokenToTraderPool(account, traderPool, amount);
      }),
    );
    console.log('Deposit From Users Completed'.bgGreen.bold);
    //=====================
    console.log('generateTraderPools was Completed'.bgYellow.bold);
  }

  private saveStateData(state: IState): void {
    storeData(state.addressData, path.resolve(__dirname, '../db', 'addressData.json'));
    storeData(state.operationsInfo, path.resolve(__dirname, '../db', 'operationsInfo.json'));
  }

  private loadStateData(): void {
    this.state.addressData = loadData<IAddressData>(path.resolve(__dirname, '../db', 'addressData.json'));
    this.state.operationsInfo = loadData<IOperationsInfo>(path.resolve(__dirname, '../db', 'operationsInfo.json'));
  }

  private async timeRange(): Promise<boolean> {
    const blockNumber = await this.state.web3.eth.getBlockNumber();
    const currentTime = moment(+(await this.state.web3.eth.getBlock(blockNumber)).timestamp * 1000);
    const finishTime = moment(this.state.timeRange.finishTime);
    return currentTime.isBefore(finishTime);
  }
}

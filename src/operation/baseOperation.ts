import { IAccount, IPoolInfo, IRawTransaction, IState } from '../interfaces/basic.interface';
import { Transaction } from 'ethereumjs-tx';
import { TransactionReceipt, PromiEvent } from 'web3-core';
import abiDecoder from 'abi-decoder';
import faker from 'faker';
import lodash from 'lodash';
import moment from 'moment';
import { getRevertReason } from '../utils/getRevertReason';
import { getCurrentExchangeRate } from '../utils/pairPrice';
import BigNumber from 'bignumber.js';
import { parsedBalanceToRaw } from '../helpers/tokens.helper';
import { getUserBalance } from '../utils/getUserBalance';
import 'colors';
import { getDecimal } from '../utils/getDecimal';
import { getMaxPositionOpenAmount } from '../utils/traderPool';
import { sendTransaction } from '../utils/sendTransaction';

export class BaseOperation {
  constructor(private state: IState) {}

  public async createTraderPoolTx(account: IAccount, basicToken: string) {
    const tpfuContract = new this.state.web3.eth.Contract(
      this.state.abis.abiTPFU,
      this.state.deployedAddresses.traderPoolFactoryUpgradeable,
    );

    abiDecoder.addABI(this.state.abis.abiTPFU);

    const txCount = await this.state.web3.eth.getTransactionCount(account.address);
    const commissions = [
      this.state.web3.utils.toHex(10),
      this.state.web3.utils.toHex(3),
      this.state.web3.utils.toHex(10),
      this.state.web3.utils.toHex(3),
      this.state.web3.utils.toHex(10),
      this.state.web3.utils.toHex(3),
    ];

    const createTraderPoolRawTransaction = {
      from: account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: this.state.deployedAddresses.traderPoolFactoryUpgradeable,
      value: this.state.web3.utils.toHex(0),
      data: tpfuContract.methods
        .createTraderContract(
          account.address,
          basicToken,
          this.state.web3.utils.toHex(0),
          commissions,
          true,
          false,
          faker.commerce.productName(),
          faker.address.stateAbbr(),
        )
        .encodeABI(),
    };
    const receipt = await sendTransaction(
      createTraderPoolRawTransaction,
      account.secretKey,
      'Pool Created',
      this.state,
    );

    const poolAddress = this.getTraderPoolAddress(receipt);
    this.addTraderPoolInfo({
      poolAddress,
      traderName: faker.name.lastName(),
      basicToken: basicToken,
      traderWallet: account.address,
    });

    // console.log('getTransactionCount', await this.state.web3.eth.getTransactionCount(poolAddress));
    // console.log('receipt', receipt, abiDecoder.decodeMethod((await this.state.web3.eth.getTransaction(receipt.transactionHash)).input));
  }

  public async depositTokenToTraderPool(account: IAccount, traderPool: IPoolInfo, amount: number) {
    await this.swapTokens(account, traderPool.basicToken, amount);
    await this.approveTransferTokenToPool(account, traderPool, amount);
    console.log('Balance before Deposit', await getUserBalance(this.state, traderPool.basicToken, account.address));

    const poolAddress = traderPool.poolAddress;
    const traderPoolContract = new this.state.web3.eth.Contract(this.state.abis.abiTraderPool, poolAddress);
    const txCount = await this.state.web3.eth.getTransactionCount(account.address);

    const createDepositTransaction = {
      from: account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: poolAddress,
      value: this.state.web3.utils.toHex(0),
      data: traderPoolContract.methods.deposit(this.state.web3.utils.toHex(amount)).encodeABI(),
    };
    await sendTransaction(createDepositTransaction, account.secretKey, 'Deposited', this.state);
    console.log('Balance after Deposit', await getUserBalance(this.state, traderPool.basicToken, account.address));
  }

  public async approveTransferTokenToPool(account: IAccount, traderPool: IPoolInfo, amount: number) {
    const tokenContract = new this.state.web3.eth.Contract(this.state.abis.abiErc20, traderPool.basicToken);
    const txCount = await this.state.web3.eth.getTransactionCount(account.address);
    const createApproveRawTransaction = {
      from: account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: traderPool.basicToken,
      value: this.state.web3.utils.toHex(0),
      data: tokenContract.methods.approve(traderPool.poolAddress, this.state.web3.utils.toHex(amount)).encodeABI(),
    };
    await sendTransaction(createApproveRawTransaction, account.secretKey, 'Approved', this.state);
  }

  public async swapTokens(account: IAccount, swapTokenAddress: string, amount: number) {
    const pancakeContract = new this.state.web3.eth.Contract(
      this.state.abis.abiPancake,
      this.state.baseAddresses.defiSwapRouter,
    );
    const txCount = await this.state.web3.eth.getTransactionCount(account.address);

    const currentPrice = await getCurrentExchangeRate(
      this.state.web3,
      this.state,
      '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      swapTokenAddress,
    );

    const path = ['0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', swapTokenAddress];
    const deadlineTime = moment(moment.now()).add(10, 'minutes').unix();

    const tokenDecimal = await getDecimal(swapTokenAddress, this.state);

    const createSwapRawTransaction: IRawTransaction = {
      from: account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: this.state.baseAddresses.defiSwapRouter,
      // add fee
      value: this.state.web3.utils.toHex(
        parsedBalanceToRaw(new BigNumber(amount).multipliedBy(1.03).dividedBy(currentPrice), tokenDecimal).toFixed(0),
      ),
      data: pancakeContract.methods
        .swapETHForExactTokens(this.state.web3.utils.toHex(amount), path, account.address, deadlineTime)
        .encodeABI(),
    };
    await sendTransaction(createSwapRawTransaction, account.secretKey, 'Token Swapped', this.state);
  }

  public async openPosition(traderPool: IPoolInfo): Promise<void> {
    const poolAddress = traderPool.poolAddress;
    const availableTokenForFuturePosition = +(await getMaxPositionOpenAmount(poolAddress, this.state));
    let newPositionSpendAmount: BigNumber;
    if (availableTokenForFuturePosition <= 0) {
      return;
    }

    if (availableTokenForFuturePosition <= 100) {
      newPositionSpendAmount = new BigNumber(availableTokenForFuturePosition);
    } else {
      newPositionSpendAmount = new BigNumber(availableTokenForFuturePosition)
        .multipliedBy(lodash.random(50, 100))
        .dividedBy(100);
    }

    const contract = new this.state.web3.eth.Contract(
      this.state.abis.abiPET,
      this.state.deployedAddresses.exchangeTool,
    );
    const txCount = await this.state.web3.eth.getTransactionCount(traderPool.traderWallet);
    const swapTokenAddress = lodash.sample(this.state.swapTokenList);
    console.log('Get', swapTokenAddress, 'Send', traderPool.basicToken);
    const currentPrice = await getCurrentExchangeRate(
      this.state.web3,
      this.state,
      traderPool.basicToken,
      swapTokenAddress,
    );
    const path = [traderPool.basicToken, swapTokenAddress];
    const deadlineTime = moment(moment.now()).add(10, 'minutes').unix();
    const getTokenDecimal = await getDecimal(swapTokenAddress, this.state);
    const getTokenAmount = parsedBalanceToRaw(
      new BigNumber(newPositionSpendAmount).multipliedBy(0.95).dividedBy(currentPrice),
      getTokenDecimal,
    ).toFixed(0);
    const traderAccount = this.state.accounts.traders.find(x => x.address === traderPool.traderWallet);

    const createOpenRawTransaction: IRawTransaction = {
      from: traderPool.traderWallet,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: this.state.deployedAddresses.exchangeTool,
      value: this.state.web3.utils.toHex(0),
      data: contract.methods
        .swapExactTokensForTokens(traderPool.poolAddress, newPositionSpendAmount, getTokenAmount, path, deadlineTime)
        .encodeABI(),
    };
    await sendTransaction(createOpenRawTransaction, traderAccount.secretKey, 'Position Opened', this.state);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async closePosition(traderPool: IPoolInfo): Promise<void> {}

  private getTraderPoolAddress(receipt: TransactionReceipt): string {
    const data = receipt.logs[receipt.logs.length - 1].data;
    const poolAddress = '0x' + data.substring(26);
    return poolAddress;
  }

  private addTraderPoolInfo(data: IPoolInfo) {
    this.state.traderPools.push(data);
  }
}

import { IAccount, IPoolInfo, IPosition, IRawTransaction, IState } from '../interfaces/basic.interface';
import { Transaction } from 'ethereumjs-tx';
import { TransactionReceipt, PromiEvent } from 'web3-core';
import abiDecoder from 'abi-decoder';
import faker from 'faker';
import lodash from 'lodash';
import moment from 'moment';
import { getRevertReason } from '../utils/getRevertReason';
import { getCurrentExchangeRate } from '../utils/pairPrice';
import BigNumber from 'bignumber.js';
import { parsedBalanceToRaw, rawBalanceToParsed } from '../helpers/tokens.helper';
import { getUserBalance } from '../utils/getUserBalance';
import 'colors';
import { getDecimal } from '../utils/getDecimal';
import { getMaxPositionOpenAmount, positionAt, positionsLength } from '../utils/traderPool';
import { sendTransaction } from '../utils/sendTransaction';
import { WethOrWbnbAddress } from '../constant/basicTokenList';

export class BaseOperation {
  constructor(private state: IState) {}

  public async createTraderPoolTx(account: IAccount, basicToken: string) {
    const tpfuContract = new this.state.web3.eth.Contract(
      this.state.contracts.traderPoolFactory.abi,
      this.state.addressData.deployedAddresses.traderPoolFactoryUpgradeable,
    );

    abiDecoder.addABI(this.state.contracts.traderPoolFactory.abi);

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
      to: this.state.addressData.deployedAddresses.traderPoolFactoryUpgradeable,
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
    const basicTokenDecimal = +(await getDecimal(traderPool.basicToken, this.state));
    const rawAmount = parsedBalanceToRaw(new BigNumber(amount), basicTokenDecimal);

    await this.swapTokens(account, traderPool.basicToken, rawAmount);
    await this.approveTransferTokenToPool(account, traderPool, rawAmount);
    console.log('Balance before Deposit', await getUserBalance(this.state, traderPool.basicToken, account.address));

    const poolAddress = traderPool.poolAddress;
    const traderPoolContract = new this.state.web3.eth.Contract(this.state.contracts.traderPool.abi, poolAddress);
    const txCount = await this.state.web3.eth.getTransactionCount(account.address);

    const createDepositTransaction = {
      from: account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: poolAddress,
      value: this.state.web3.utils.toHex(0),
      // exclude some fee - in some thimes error
      data: traderPoolContract.methods.deposit(this.state.web3.utils.toHex(rawAmount.toFixed(0))).encodeABI(),
    };
    await sendTransaction(createDepositTransaction, account.secretKey, 'Deposited', this.state);
    console.log('Balance after Deposit', await getUserBalance(this.state, traderPool.basicToken, account.address));
  }

  private async approveTransferTokenToPool(account: IAccount, traderPool: IPoolInfo, rawAmount: BigNumber) {
    const tokenContract = new this.state.web3.eth.Contract(this.state.contracts.erc20.abi, traderPool.basicToken);
    const txCount = await this.state.web3.eth.getTransactionCount(account.address);
    const createApproveRawTransaction = {
      from: account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: traderPool.basicToken,
      value: this.state.web3.utils.toHex(0),
      data: tokenContract.methods
        .approve(traderPool.poolAddress, this.state.web3.utils.toHex(rawAmount.toFixed(0)))
        .encodeABI(),
    };
    await sendTransaction(createApproveRawTransaction, account.secretKey, undefined, this.state);
  }

  private async swapTokens(account: IAccount, swapTokenAddress: string, rawAmount: BigNumber): Promise<void> {
    const pancakeContract = new this.state.web3.eth.Contract(
      this.state.contracts.swapRouterV2.abi,
      this.state.addressData.baseAddresses.defiSwapRouter,
    );
    const swapTokenDecimal = await getDecimal(swapTokenAddress, this.state);
    const wethDecimal = 18;
    const txCount = await this.state.web3.eth.getTransactionCount(account.address);
    const currentPrice = await getCurrentExchangeRate(this.state.web3, this.state, WethOrWbnbAddress, swapTokenAddress);
    // add fee
    const sendEthValueParsed = rawBalanceToParsed(rawAmount, swapTokenDecimal)
      .multipliedBy(1.15)
      .dividedBy(currentPrice);

    const path = [WethOrWbnbAddress, swapTokenAddress];
    const deadlineTime = moment(moment.now()).add(10, 'minutes').unix();
    // console.log(parsedBalanceToRaw(sendEthValueParsed, wethDecimal).toFixed(0), rawAmount.toFixed(0));
    const createSwapRawTransaction: IRawTransaction = {
      from: account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: this.state.addressData.baseAddresses.defiSwapRouter,
      value: this.state.web3.utils.toHex(
        // Not correct work with different token decimal, need improve
        parsedBalanceToRaw(sendEthValueParsed, wethDecimal).toFixed(0),
      ),
      data: pancakeContract.methods
        .swapETHForExactTokens(this.state.web3.utils.toHex(rawAmount.toFixed(0)), path, account.address, deadlineTime)
        .encodeABI(),
    };
    await sendTransaction(createSwapRawTransaction, account.secretKey, undefined, this.state);
  }

  public async openPosition(traderPool: IPoolInfo): Promise<void> {
    const poolAddress = traderPool.poolAddress;
    const poolBaseTokenDecimal = await getDecimal(traderPool.basicToken, this.state);
    const availableTokenForFuturePosition = new BigNumber(await getMaxPositionOpenAmount(poolAddress, this.state));
    let newPositionSpendAmountRaw: BigNumber;
    if (availableTokenForFuturePosition.isLessThanOrEqualTo(0)) {
      console.log('Not Available Tokens for position'.bgWhite, traderPool.poolAddress);
      return;
    }

    if (
      availableTokenForFuturePosition.isLessThanOrEqualTo(parsedBalanceToRaw(new BigNumber(100), poolBaseTokenDecimal))
    ) {
      newPositionSpendAmountRaw = new BigNumber(availableTokenForFuturePosition);
    } else {
      newPositionSpendAmountRaw = new BigNumber(availableTokenForFuturePosition)
        .multipliedBy(lodash.random(3, 10))
        .dividedBy(100);
    }

    const contract = new this.state.web3.eth.Contract(
      this.state.contracts.exchangeTool.abi,
      this.state.addressData.deployedAddresses.exchangeTool,
    );
    const txCount = await this.state.web3.eth.getTransactionCount(traderPool.traderWallet);
    const swapTokenAddress = lodash.sample(this.state.addressData.swapTokenList);
    console.log(
      'Get',
      swapTokenAddress,
      'Send',
      traderPool.basicToken,
      availableTokenForFuturePosition.toString(),
      newPositionSpendAmountRaw.toString(),
    );

    const path = [traderPool.basicToken, swapTokenAddress];
    const deadlineTime = moment(moment.now()).add(10, 'minutes').unix();
    const traderAccount = this.state.accounts.traders.find(x => x.address === traderPool.traderWallet);

    const createOpenRawTransaction: IRawTransaction = {
      from: traderPool.traderWallet,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: this.state.addressData.deployedAddresses.exchangeTool,
      value: this.state.web3.utils.toHex(0),
      data: contract.methods
        .swapExactTokensForTokens(
          traderPool.poolAddress,
          this.state.web3.utils.toHex(newPositionSpendAmountRaw.toFixed(0)),
          this.state.web3.utils.toHex(0),
          path,
          deadlineTime,
        )
        .encodeABI(),
    };
    await sendTransaction(createOpenRawTransaction, traderAccount.secretKey, 'Position Opened', this.state);
  }

  public async closePosition(traderPool: IPoolInfo): Promise<void> {
    const poolAddress = traderPool.poolAddress;
    const poolBaseTokenDecimal = await getDecimal(traderPool.basicToken, this.state);
    const positionLength = +(await positionsLength(poolAddress, this.state));
    if (positionLength === 0) {
      console.log('Not Opened position'.bgWhite, traderPool.poolAddress);
      return;
    }
    const positions = await this.getOpenPositions(poolAddress, positionLength);
    const selectedPosition = lodash.sample(positions);
    const availablePositionAmountRaw = new BigNumber(selectedPosition.liquidity);
    let closePositionAmountRaw: BigNumber;
    let transactionMessage: string;

    if (availablePositionAmountRaw.isLessThanOrEqualTo(parsedBalanceToRaw(new BigNumber(100), poolBaseTokenDecimal))) {
      closePositionAmountRaw = availablePositionAmountRaw;
      transactionMessage = 'Position Closed';
    } else {
      closePositionAmountRaw = availablePositionAmountRaw.multipliedBy(lodash.random(50, 100)).dividedBy(100);
      transactionMessage = 'Partial Position Closed';
    }

    const contract = new this.state.web3.eth.Contract(
      this.state.contracts.exchangeTool.abi,
      this.state.addressData.deployedAddresses.exchangeTool,
    );
    const txCount = await this.state.web3.eth.getTransactionCount(traderPool.traderWallet);
    const path = [selectedPosition.token, traderPool.basicToken];
    const deadlineTime = moment(moment.now()).add(10, 'minutes').unix();
    const traderAccount = this.state.accounts.traders.find(x => x.address === traderPool.traderWallet);

    const createOpenRawTransaction: IRawTransaction = {
      from: traderPool.traderWallet,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: this.state.addressData.deployedAddresses.exchangeTool,
      value: this.state.web3.utils.toHex(0),
      data: contract.methods
        .swapExactTokensForTokens(
          traderPool.poolAddress,
          this.state.web3.utils.toHex(closePositionAmountRaw.toFixed(0)),
          this.state.web3.utils.toHex(0),
          path,
          deadlineTime,
        )
        .encodeABI(),
    };
    await sendTransaction(createOpenRawTransaction, traderAccount.secretKey, transactionMessage, this.state);
  }

  private async getOpenPositions(poolAddress: string, positionLength: number): Promise<IPosition[]> {
    const positions: IPosition[] = [];
    for (let i = 0; i < positionLength; i++) {
      const result: IPosition = await positionAt(i, poolAddress, this.state).then(x => {
        return {
          amountOpened: x['0'],
          liquidity: x['1'],
          token: x['2'],
        };
      });
      positions.push(result);
    }
    return positions;
  }

  private getTraderPoolAddress(receipt: TransactionReceipt): string {
    const data = receipt.logs[receipt.logs.length - 1].data;
    const poolAddress = '0x' + data.substring(26);
    return poolAddress;
  }

  private addTraderPoolInfo(data: IPoolInfo) {
    this.state.addressData.traderPools.push(data);
  }
}

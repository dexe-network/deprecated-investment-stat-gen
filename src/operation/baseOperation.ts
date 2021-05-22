import {IAccount, IPoolInfo, IRawTransaction, IState} from '../interfaces/basic.interface';
import {Transaction} from 'ethereumjs-tx';
import {TransactionReceipt, PromiEvent} from 'web3-core';
import abiDecoder from 'abi-decoder';
import faker from 'faker';
import lodash from 'lodash';
import moment from 'moment';
import {getRevertReason} from '../utils/getRevertReason';
import {getCurrentExchangeRate} from '../utils/pairPrice';
import BigNumber from 'bignumber.js';
import {parsedBalanceToRaw} from '../helpers/tokens.helper';
import {getUserBalance} from '../utils/getUserBalance';

export class BaseOperation {
    constructor(private state: IState) {

    }

    public async createTraderPoolTx(account: IAccount, basicToken: string) {
        const tpfuContract = new this.state.web3.eth.Contract(this.state.abis.abiTPFU, this.state.baseAddresses.traderPoolFactoryUpgradeable);

        abiDecoder.addABI(this.state.abis.abiTPFU);

        const txCount = await this.state.web3.eth.getTransactionCount(account.address);
        const commissions = [this.state.web3.utils.toHex(10), this.state.web3.utils.toHex(3), this.state.web3.utils.toHex(10), this.state.web3.utils.toHex(3), this.state.web3.utils.toHex(10), this.state.web3.utils.toHex(3)];

        const createTraderPoolRawTransaction = {
            from: account.address,
            nonce: this.state.web3.utils.toHex(txCount),
            gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
            gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
            to: this.state.baseAddresses.traderPoolFactoryUpgradeable,
            value: this.state.web3.utils.toHex(0),
            data: tpfuContract.methods.createTraderContract(account.address, basicToken, this.state.web3.utils.toHex(lodash.random(1, 9) * 100000), commissions, true, false, faker.commerce.productName(), faker.address.stateAbbr()).encodeABI(),
        }
        const receipt = await this.sendTransaction(createTraderPoolRawTransaction, account.secretKey, 'Create Pool');

        const poolAddress = this.getTraderPoolAddress(receipt);
        this.addTraderPoolInfo({
            poolAddress,
            traderName: faker.name.lastName(),
            basicToken: basicToken,
            traderWallet: account.address
        })

        // console.log('getTransactionCount', await this.state.web3.eth.getTransactionCount(poolAddress));
        // console.log('receipt', receipt, abiDecoder.decodeMethod((await this.state.web3.eth.getTransaction(receipt.transactionHash)).input));
    }

    public async depositTokenToTraderPool(account: IAccount, traderPool: IPoolInfo, amount: number) {
        await this.swapTokens(account, traderPool.basicToken, amount);
        await this.approveTransferTokenToPool(account, traderPool, amount);
        console.log('Balance before Deposit' , await getUserBalance(this.state, traderPool.basicToken, account.address))

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
        }
        await this.sendTransaction(createDepositTransaction, account.secretKey, 'Deposit');
        console.log('Balance after Deposit' , await getUserBalance(this.state, traderPool.basicToken, account.address))
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
        }
        await this.sendTransaction(createApproveRawTransaction, account.secretKey, 'Approve');
    }

    public async swapTokens(account: IAccount, swapTokenAddress: string, amount: number) {
        const pancakeContract = new this.state.web3.eth.Contract(this.state.abis.abiPancake, this.state.baseAddresses.pancakeSwapRouterV2);
        const txCount = await this.state.web3.eth.getTransactionCount(account.address);

        const currentPrice = await getCurrentExchangeRate(this.state.web3, this.state, '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', swapTokenAddress);

        const path = ['0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', swapTokenAddress];
        const deadlineTime = moment(moment.now()).add(10, 'minutes').unix();

        const createSwapRawTransaction: IRawTransaction = {
            from: account.address,
            nonce: this.state.web3.utils.toHex(txCount),
            gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
            gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
            to: this.state.baseAddresses.pancakeSwapRouterV2,
            // add fee
            value: this.state.web3.utils.toHex(
                parsedBalanceToRaw(
                    new BigNumber(amount).multipliedBy(1.03).dividedBy(currentPrice),
                    18
                ).toFixed(0)
            ),
            data: pancakeContract.methods.swapETHForExactTokens(this.state.web3.utils.toHex(amount), path, account.address, deadlineTime).encodeABI(),
        }
        await this.sendTransaction(createSwapRawTransaction, account.secretKey, 'Swap Token');
    }

    private sendTransaction(rawTransaction: IRawTransaction, secretKey: Buffer, type: string): PromiEvent<TransactionReceipt> {
        const transaction = new Transaction(rawTransaction);
        transaction.sign(secretKey);
        const serializedTransaction = transaction.serialize();

        return this.state.web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
            .on('transactionHash', (r) => {
                console.log(type, ": Transaction sent, TX hash:", r)
            })
            .on('error', (r) => {
                console.log("Error sending transaction (TRANSACTION TYPE 2):", r)
                // @ts-ignore
                getRevertReason(r.receipt.transactionHash, this.state)
            })
    }

    private getTraderPoolAddress(receipt: TransactionReceipt): string {
        const data = receipt.logs[receipt.logs.length - 1].data;
        const poolAddress = '0x' + data.substring(26);
        return poolAddress;
    }

    private addTraderPoolInfo(data: IPoolInfo) {
        this.state.traderPools.push(data);
    }

}

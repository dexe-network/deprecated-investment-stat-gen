import { IRawTransaction, IState } from '../interfaces/basic.interface';
import { TransactionReceipt } from 'web3-core';
import { Transaction } from 'ethereumjs-tx';
import { getRevertReason } from './getRevertReason';
import moment from 'moment';

export const sendTransaction = async (
  rawTransaction: IRawTransaction,
  secretKey: Buffer,
  type: string,
  state: IState,
): Promise<TransactionReceipt> => {
  try {
    await new Promise((resolve, reject) => {
      state.provider.send(
        {
          jsonrpc: '2.0',
          method: 'evm_mine',
          params: [],
        },
        () => {
          resolve({});
        },
      );
    });
    await new Promise((resolve, reject) => {
      state.provider.send(
        {
          jsonrpc: '2.0',
          method: 'evm_increaseTime',
          params: [3600],
        },
        () => {
          resolve({});
        },
      );
    });
    const transaction = new Transaction(rawTransaction);
    transaction.sign(secretKey);
    const serializedTransaction = transaction.serialize();
    const receipt = await state.web3.eth
      .sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
      .on('transactionHash', r => {
        if (type) {
          console.log(type.bgWhite.bold, 'Transaction sent, TX hash:'.magenta.bold, r);
        }
      })
      .on('error', error => {
        // console.log('Error sending transaction (TRANSACTION TYPE 2):', error);
        void getRevertReason(error, state);
      });
    console.log(
      'TIME'.bgYellow,
      moment(+(await state.web3.eth.getBlock(receipt.blockNumber)).timestamp * 1000).toDate(),
    );
    return receipt;
  } catch (error) {
    void getRevertReason(error, state);
  }
};

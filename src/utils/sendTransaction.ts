import { IRawTransaction, IState } from '../interfaces/basic.interface';
import { TransactionReceipt } from 'web3-core';
import { Transaction } from 'ethereumjs-tx';
import { getRevertReason } from './getRevertReason';
import { sleeper } from '../helpers/common.helper';

export const sendTransaction = async (
  rawTransaction: IRawTransaction,
  secretKey: Buffer,
  type: string,
  state: IState,
): Promise<TransactionReceipt> => {
  try {
    const transaction = new Transaction(rawTransaction);
    transaction.sign(secretKey);
    const serializedTransaction = transaction.serialize();
    // await sleeper(100);
    const receipt = await state.web3.eth
      .sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
      .on('transactionHash', r => {
        console.log(type.bgWhite.bold, 'Transaction sent, TX hash:'.magenta.bold, r);
      })
      .on('error', error => {
        // console.log('Error sending transaction (TRANSACTION TYPE 2):', error);
        void getRevertReason(error, state);
      });
    // await sleeper(100);
    return receipt;
  } catch (error) {
    void getRevertReason(error, state);
  }
};
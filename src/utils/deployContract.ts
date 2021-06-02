import { IAccount, IState } from '../interfaces/basic.interface';
import fs from 'fs';
import path from 'path';
import { Contract } from 'web3-eth-contract';
import { contractCallErrorHandler } from '../helpers/error.helper';

export const deployContract = async (state: IState, fileName: string, account: IAccount): Promise<Contract> => {
  try {
    const source = fs.readFileSync(path.resolve(__dirname, '../contracts', `${fileName}.json`));
    const contract = JSON.parse(source.toString());
    const abi = contract.abi;
    const code = contract.bytecode;
    const SampleContract = new state.web3.eth.Contract(abi);
    const deployedContract = await SampleContract.deploy({
      data: code,
    }).send({
      from: account.address,
      gasPrice: state.config.gasPrice.toString(),
      gas: state.config.gasLimit,
    });
    return deployedContract;
  } catch (e) {
    contractCallErrorHandler(e);
  }
};

import { IState } from '../interfaces/basic.interface';
import { contractCallErrorHandler } from '../helpers/error.helper';
import { Contract } from 'web3-eth-contract';
import fs from 'fs';
import path from 'path';

export function getContract(fileName: string, contractAddress: string, state: IState): Contract {
  try {
    const source = fs.readFileSync(path.resolve(__dirname, '../contracts', `${fileName}.json`));
    const contract = JSON.parse(source.toString());
    const abi = contract.abi;
    return new state.web3.eth.Contract(abi, contractAddress);
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

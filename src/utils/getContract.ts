import { IContract, IState } from '../interfaces/basic.interface';
import { contractCallErrorHandler } from '../helpers/error.helper';
import { Contract } from 'web3-eth-contract';

export function getContract(contract: IContract, contractAddress: string, state: IState): Contract {
  try {
    const abi = contract.abi;
    return new state.web3.eth.Contract(abi, contractAddress);
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

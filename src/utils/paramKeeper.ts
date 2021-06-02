import { IState } from '../interfaces/basic.interface';
import { contractCallErrorHandler } from '../helpers/error.helper';

export async function getAddress(state: IState): Promise<string> {
  try {
    // const contract = new state.web3.eth.Contract(state.abis.abiParamKeeper, state.baseAddresses.paramKeeper);
    // const address = await contract.methods.getAddress(1000).call();
    // return address;
    return '';
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

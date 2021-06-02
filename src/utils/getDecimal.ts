import { IState } from '../interfaces/basic.interface';
import { contractCallErrorHandler } from '../helpers/error.helper';

export async function getDecimal(contractAddress: string, state: IState): Promise<number> {
  try {
    const contract = new state.web3.eth.Contract(state.abis.abiErc20, contractAddress);
    const decimals = await contract.methods.decimals().call();
    return +decimals;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

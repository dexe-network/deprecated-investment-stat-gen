import { IState } from '../interfaces/basic.interface';
import { contractCallErrorHandler } from '../helpers/error.helper';
import { getContract } from './getContract';

export async function getTotalSupply(contractAddress: string, state: IState): Promise<string> {
  try {
    const contract = getContract('TraderPoolUpgradeable', contractAddress, state);
    const totalSupply = await contract.methods.totalSupply().call();
    return totalSupply;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function getDepositedAmount(contractAddress: string, state: IState): Promise<string> {
  try {
    const contract = getContract('TraderPoolUpgradeable', contractAddress, state);
    const deposits = await contract.methods.getTotalValueLocked().call();
    return deposits;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function positionAt(index, contractAddress: string, state: IState): Promise<{}> {
  try {
    const contract = getContract('TraderPoolUpgradeable', contractAddress, state);
    const amount = await contract.methods.positionAt(index).call();
    return amount;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function positionsLength(contractAddress: string, state: IState): Promise<string> {
  try {
    const contract = getContract('TraderPoolUpgradeable', contractAddress, state);
    const amount = await contract.methods.positionsLength().call();
    return amount;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function getMaxPositionOpenAmount(contractAddress: string, state: IState): Promise<string> {
  try {
    const contract = getContract('TraderPoolUpgradeable', contractAddress, state);
    const amount = await contract.methods.getMaxPositionOpenAmount().call();
    return amount;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

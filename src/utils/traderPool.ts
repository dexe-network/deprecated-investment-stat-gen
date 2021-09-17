import { IState } from '../interfaces/basic.interface';
import { contractCallErrorHandler } from '../helpers/error.helper';
import { getContract } from './getContract';
import BigNumber from 'bignumber.js';

export async function getTotalSupply(contractAddress: string, state: IState): Promise<string> {
  try {
    const contract = getContract(state.contracts.traderPool, contractAddress, state);
    const totalSupply = await contract.methods.totalSupply().call();
    return totalSupply;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function getDepositedAmount(contractAddress: string, state: IState): Promise<string> {
  try {
    const contract = getContract(state.contracts.traderPool, contractAddress, state);
    const deposits = await contract.methods.getTotalValueLocked().call();
    return deposits;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function positionAt(index, contractAddress: string, state: IState): Promise<any> {
  try {
    const contract = getContract(state.contracts.traderPool, contractAddress, state);
    const amount = await contract.methods.positionAt(index).call();
    return amount;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function positionsLength(contractAddress: string, state: IState): Promise<string> {
  try {
    const contract = getContract(state.contracts.traderPool, contractAddress, state);
    const amount = await contract.methods.positionsLength().call();
    return amount;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function getMaxPositionOpenAmount(contractAddress: string, state: IState): Promise<string> {
  try {
    const contract = getContract(state.contracts.traderPool, contractAddress, state);
    const amount = await contract.methods.getMaxPositionOpenAmount().call();
    return amount;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function getAmountOut(amountIn: BigNumber, path: string[], state: IState): Promise<string> {
  try {
    console.log(amountIn.toFixed(0), path);
    const contract = getContract(state.contracts.swapRouterV2, state.addressData.baseAddresses.defiSwapRouter, state);
    const amount = await contract.methods.getAmountsOut(state.web3.utils.toHex(amountIn.toFixed(0)), path).call();
    if (amount?.length) {
      return amount[amount.length - 1];
    } else {
      throw new Error('getAmountOut Error');
    }
  } catch (e) {
    console.log('getAmountOut Error'.bgRed.bold);
    contractCallErrorHandler(e);
  }
}

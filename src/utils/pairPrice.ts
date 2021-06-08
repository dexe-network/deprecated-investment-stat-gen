import Web3 from 'web3';
import { IContractTokenNames, IReserveData, IState, ITokenPriceData } from '../interfaces/basic.interface';
import BigNumber from 'bignumber.js';
import { contractCallErrorHandler } from '../helpers/error.helper';
import { getContract } from './getContract';

async function getPairContractAddress(
  web3: Web3,
  state: IState,
  sendToken: string,
  receiveToken: string,
): Promise<string> {
  try {
    const contract = getContract(state.contracts.swapFactory, state.addressData.baseAddresses.defiFactory, state);
    const pairAddress = await contract.methods.getPair(sendToken, receiveToken).call();
    return pairAddress;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

async function getReserves(web3: Web3, state: IState, pairAddress: string): Promise<IReserveData> {
  try {
    const contract = new state.web3.eth.Contract(state.contracts.pairContract.abi, pairAddress);
    const reserves = await contract.methods.getReserves().call();
    return reserves;
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

async function getTokensData(
  web3: Web3,
  state: IState,
  pairAddress: string,
  sendToken: string,
  receiveToken: string,
  reserves: IReserveData,
): Promise<ITokenPriceData> {
  try {
    const contract = new state.web3.eth.Contract(state.contracts.pairContract.abi, pairAddress);
    const token0 = await contract.methods.token0().call();
    const token1 = await contract.methods.token1().call();

    return sendToken.toLowerCase() === token0.toLowerCase()
      ? {
          sendToken: {
            address: token0,
            reserve: reserves.reserve0,
          },
          receiveToken: {
            address: token1,
            reserve: reserves.reserve1,
          },
        }
      : {
          sendToken: {
            address: token1,
            reserve: reserves.reserve1,
          },
          receiveToken: {
            address: token0,
            reserve: reserves.reserve0,
          },
        };
  } catch (e) {
    contractCallErrorHandler(e);
  }
}

export async function getCurrentExchangeRate(
  web3: Web3,
  state: IState,
  sendToken: string,
  receiveToken: string,
): Promise<string> {
  // Not correct work if token with different decimal , need some improve
  const pairContractAddress = await getPairContractAddress(web3, state, sendToken, receiveToken);
  const reserves = await getReserves(web3, state, pairContractAddress);
  const tokensData = await getTokensData(web3, state, pairContractAddress, sendToken, receiveToken, reserves);
  return new BigNumber(tokensData.receiveToken.reserve).dividedBy(tokensData.sendToken.reserve).toString();
}

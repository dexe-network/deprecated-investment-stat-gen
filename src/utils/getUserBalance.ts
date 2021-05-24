import {IState} from '../interfaces/basic.interface';

export async function getUserBalance(state: IState, contractAddress, userAddress): Promise<string> {
    try {
        const tokenContract = new state.web3.eth.Contract(state.abis.abiErc20, contractAddress);
        const balance = await tokenContract.methods.balanceOf(userAddress).call();
        return balance;
    } catch (e) {
        throw e;
    }
}
import {IState} from '../interfaces/basic.interface';

export async function getTotalSupply(contractAddress: string, state: IState): Promise<string> {
    try {
        const contract = new state.web3.eth.Contract(state.abis.abiTraderPool, contractAddress);
        const totalSupply = await contract.methods.totalSupply().call();
        return totalSupply;
    } catch (e) {
        console.log(e)
    }
}

export async function getDepositedAmount(contractAddress: string, state: IState): Promise<string> {
    try {
        const contract = new state.web3.eth.Contract(state.abis.abiTraderPool, contractAddress);
        const deposits = await contract.methods.getTotalValueLocked().call();
        return deposits;
    } catch (e) {
        console.log(e)
    }
}

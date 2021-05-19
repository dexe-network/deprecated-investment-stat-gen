import {Transaction} from 'ethereumjs-tx';
import abiDecoder from 'abi-decoder';
import {IState} from '../interfaces/basic.interface';

export async function createTraderPoolTx(state: IState) {
    const tpfuContract = new state.web3.eth.Contract(state.abiTPFU, state.traderPoolFactoryUpgradeableAddress);

    abiDecoder.addABI(state.abiTPFU);

    const txCount = await state.web3.eth.getTransactionCount(state.config.walletAddress);
    const commissions = [state.web3.utils.toHex(10),state.web3.utils.toHex(3), state.web3.utils.toHex(10),state.web3.utils.toHex(3), state.web3.utils.toHex(10),state.web3.utils.toHex(3)];

    const createTraderPoolRawTransaction = {
        "from": state.config.walletAddress,
        "nonce": state.web3.utils.toHex(txCount),
        "gasPrice": state.web3.utils.toHex(state.config.gasPrice),
        "gasLimit": state.web3.utils.toHex(state.config.gasLimit),
        "to": state.traderPoolFactoryUpgradeableAddress,
        "value": state.web3.utils.toHex(0),
        "data": tpfuContract.methods.createTraderContract(state.config.walletAddress, state.config.basicTokenAddress, state.web3.utils.toHex(1000), commissions, true, false, "Statistic Trader DEXE", "STDX").encodeABI(),
    }

    const privKey = state.config.privateKey;
    const transaction = new Transaction(createTraderPoolRawTransaction)
    transaction.sign(privKey)
    const serializedTransaction = transaction.serialize();

    const receipt = await state.web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
        .on('transactionHash', function a(r) {
            console.log("Transaction (TRANSACTION TYPE 2) has been sent, TX hash:", r)
        })
        .on('error', function a(r) {
            console.log("Error sending transaction (TRANSACTION TYPE 2):", r)
        })
    // console.log('receipt', receipt, abiDecoder.decodeMethod((await web3.eth.getTransaction(receipt.transactionHash)).input));
    // console.log('2')
    // console.log('receipt', receipt);
}

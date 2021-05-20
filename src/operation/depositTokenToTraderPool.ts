import {IPoolInfo, IState} from '../interfaces/basic.interface';
import moment from 'moment';
import {Transaction} from 'ethereumjs-tx';
import {getRevertReason} from '../utils/getRevertReason';

export async function depositTokenToTraderPool(state: IState, amount: number) {
    await approveTransferTokenToPool(state.traderPools[0], state, amount)

    const poolAddress = state.traderPools[0].poolAddress;
    const traderPoolContract = new state.web3.eth.Contract(state.abis.abiTraderPool, poolAddress);
    const txCount = await state.web3.eth.getTransactionCount(state.config.walletAddress);

    const createSwapRawTransaction = {
        "from": state.config.walletAddress,
        "nonce": state.web3.utils.toHex(txCount),
        "gasPrice": state.web3.utils.toHex(state.config.gasPrice),
        "gasLimit": state.web3.utils.toHex(state.config.gasLimit),
        "to": poolAddress,
        "value": state.web3.utils.toHex(0),
        "data": traderPoolContract.methods.deposit(state.web3.utils.toHex(amount)).encodeABI(),
    }

    const privKey = state.config.privateKey;
    const transaction = new Transaction(createSwapRawTransaction)
    transaction.sign(privKey)
    const serializedTransaction = transaction.serialize();

    const receipt = await state.web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
        .on('transactionHash', function a(r) {
            console.log("Transaction (TRANSACTION TYPE 2) has been sent, TX hash:", r)
        })
        .on('error', function a(r) {
            console.log("Error sending transaction (TRANSACTION TYPE 2):", r)
            // @ts-ignore
            getRevertReason(r.receipt.transactionHash, state)
        }).catch(error => {
            console.log('ERROR')
        })
    // console.log('receipt', receipt, abiDecoder.decodeMethod((await web3.eth.getTransaction(receipt.transactionHash)).input));
    // console.log('2')
    // console.log('receipt', receipt);
}

async function approveTransferTokenToPool(data: IPoolInfo, state: IState, amount: number) {
    const traderPoolContract = new state.web3.eth.Contract(state.abis.abiErc20, data.basicToken);
    const txCount = await state.web3.eth.getTransactionCount(state.config.walletAddress);
    const createApproveRawTransaction = {
        "from": state.config.walletAddress,
        "nonce": state.web3.utils.toHex(txCount),
        "gasPrice": state.web3.utils.toHex(state.config.gasPrice),
        "gasLimit": state.web3.utils.toHex(state.config.gasLimit),
        "to": data.basicToken,
        "value": state.web3.utils.toHex(0),
        "data": traderPoolContract.methods.approve(data.poolAddress ,state.web3.utils.toHex(amount)).encodeABI(),
    }

    const privKey = state.config.privateKey;
    const transaction = new Transaction(createApproveRawTransaction)
    transaction.sign(privKey)
    const serializedTransaction = transaction.serialize();

    const receipt = await state.web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
        .on('transactionHash', function a(r) {
            console.log("Transaction (TRANSACTION TYPE 2) has been sent, TX hash:", r)
        })
        .on('error', function a(r) {
            console.log("Error sending transaction (TRANSACTION TYPE 2):", r)
            // @ts-ignore
            getRevertReason(r.receipt.transactionHash, state)
        }).catch(error => {
            console.log('ERROR')
        })
}

import {IState} from '../interfaces/basic.interface';
import {Transaction} from 'ethereumjs-tx';
import moment from 'moment';
import {getRevertReason} from '../utils/getRevertReason';

export async function swapTokens(state: IState) {
    state.web3.eth.handleRevert = true
    const pancakeContract = new state.web3.eth.Contract(state.abis.abiPancake, state.pancakeRouterAddress);
    const txCount = await state.web3.eth.getTransactionCount(state.config.walletAddress);

    const path = ['0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', state.config.busdTokenAddress];
    const deadlineTime = moment(moment.now()).add(10, 'minutes').unix();

    const createSwapRawTransaction = {
        "from": state.config.walletAddress,
        "nonce": state.web3.utils.toHex(txCount),
        "gasPrice": state.web3.utils.toHex(state.config.gasPrice),
        "gasLimit": state.web3.utils.toHex(state.config.gasLimit),
        "to": state.pancakeRouterAddress,
        "value": state.web3.utils.toHex(10),
        "data": pancakeContract.methods.swapETHForExactTokens(state.web3.utils.toHex(1000), path, state.config.walletAddress, deadlineTime).encodeABI(),
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

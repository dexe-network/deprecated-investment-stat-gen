import {IState} from '../interfaces/basic.interface';
import 'colors';

export async function getRevertReason(txHash, state: IState) {
    try {
        const tx = await state.web3.eth.getTransaction(txHash)

        const callResult = await state.web3.eth.call(tx, tx.blockNumber)

        const result = callResult.startsWith('0x') ? callResult : `0x${callResult}`

        if (result && result.substr(138)) {

            const reason = state.web3.utils.toAscii(result.substr(138))
            console.log('Revert reason:', reason);
            return reason

        } else {

            console.log('Cannot get reason - No return value')

        }
    } catch (e) {
        for (const [key, value] of Object.entries(e.results)) {
            // @ts-ignore
            console.log(`Error ${value.error}`.bgRed.bold, `Reason ${value.reason}`.bgYellow.bold, "TX hash:".magenta.bold, key);
        }
    }
}

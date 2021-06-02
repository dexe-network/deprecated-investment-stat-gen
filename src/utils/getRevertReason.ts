import { IState } from '../interfaces/basic.interface';
import 'colors';

export async function getRevertReason(error: any, state: IState) {
  try {
    if (!error?.receipt?.transactionHash) {
      console.log(`Error ${error.name}`.bgRed.bold, `Reason ${error.message}`.bgYellow.bold);
      return;
    }

    const tx = await state.web3.eth.getTransaction(error.receipt.transactionHash);

    const callResult = await state.web3.eth.call(tx, tx.blockNumber);

    const result = callResult.startsWith('0x') ? callResult : `0x${callResult}`;

    if (result && result.substr(138)) {
      const reason = state.web3.utils.toAscii(result.substr(138));
      console.log('Revert reason:', reason);
      return reason;
    } else {
      console.log('Cannot get reason - No return value');
    }
  } catch (e) {
    if (!e?.results) {
      console.error(e);
      return;
    }

    for (const [key, value] of Object.entries(e?.results)) {
      console.log(
        // @ts-ignore
        `Error ${value.error}`.bgRed.bold,
        // @ts-ignore
        `Reason ${value.reason}`.bgYellow.bold,
        'TX hash:'.magenta.bold,
        key,
      );
    }
  }
}

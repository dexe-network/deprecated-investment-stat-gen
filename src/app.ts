import Ganache from 'ganache-core';
import path from 'path';
import fs from 'fs';
import { stateInitializer } from './utils/stateInit';
import { BaseGenerator } from './generator/baseGenerator';
import BigNumber from 'bignumber.js';
import moment from 'moment';

export const generationRange = {
  startTime: new Date('2021-03-23 19:11'),
  finishTime: new Date('2021-04-01 19:11'),
};

const ganacheOptions: Ganache.IProviderOptions = {
  account_keys_path: path.resolve(__dirname, 'accounts.json'),
  // fork: fs.existsSync(path.resolve(__dirname, 'db')) ? undefined : 'https://bsc-dataseed1.binance.org',
  // fork: 'https://bsc-dataseed1.binance.org',
  fork: 'ws://eth.getblock.io/mainnet/?api_key=ba8b0738-9220-42e7-97fb-5e607e581ab7',
  networkId: 56,
  fork_block_number: 12096424,
  time: fs.existsSync(path.resolve(__dirname, 'db')) ? generationRange.finishTime : generationRange.startTime,
  hardfork: 'istanbul',
  blockTime: 0,
  default_balance_ether: 10000,
  total_accounts: 301,
  seed: 'F8Jn2WgcAw',
  // debug: true,
  // forkCacheSize: 54857600,
  mnemonic: 'catalog forum over nut turkey topic village reduce issue speak enforce diamond capable horror click',
  db_path: path.resolve(__dirname, 'db', 'db'),
};

const server = Ganache.server(ganacheOptions);
const provider = server.provider;
const state = stateInitializer(provider);
const Generator = new BaseGenerator(state);

async function run(): Promise<void> {
  try {
    // Set Configs
    state.web3.eth.handleRevert = true;
    console.log(
      'TIME'.bgYellow,
      moment(+(await state.web3.eth.getBlock(await state.web3.eth.getBlockNumber())).timestamp * 1000).toDate(),
    );
    BigNumber.config({ EXPONENTIAL_AT: 1e9 });
    //

    void Generator.run();
  } catch (e) {
    console.error(e);
  }
}

server.listen(8545, () => {
  console.log('Ganache Server started', 'ws://localhost:8545');
});

void run();

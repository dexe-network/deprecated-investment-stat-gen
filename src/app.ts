import ganacheCore from 'ganache-core';
import Ganache from 'ganache-core';
import path from 'path';
import { stateInitializer } from './utils/stateInit';
import { BaseGenerator } from './generator/baseGenerator';
import BigNumber from 'bignumber.js';

const ganacheOptions: Ganache.IProviderOptions = {
  account_keys_path: path.resolve(__dirname, 'accounts.json'),
  fork: 'https://bsc-dataseed1.binance.org',
  networkId: 56,
  hardfork: 'istanbul',
  blockTime: 1,
  default_balance_ether: 10000,
  total_accounts: 301,
  seed: 'F8Jn2WgcAw',
  mnemonic: 'catalog forum over nut turkey topic village reduce issue speak enforce diamond capable horror click',
  db_path: path.resolve(__dirname, 'db', 'db'),
};

const provider = ganacheCore.provider(ganacheOptions);
const state = stateInitializer(provider);
const Generator = new BaseGenerator(state);

async function run(): Promise<void> {
  try {
    // Set Configs
    state.web3.eth.handleRevert = true;
    BigNumber.config({ EXPONENTIAL_AT: 1e9 });
    //

    void Generator.run();
  } catch (e) {
    console.error(e);
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
setInterval(() => {}, 10000);

void run();

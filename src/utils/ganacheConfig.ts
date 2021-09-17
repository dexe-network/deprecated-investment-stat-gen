import path from 'path';
import fs from 'fs';
import Ganache from 'ganache-core';

export const generationRange = {
  startTime: new Date('2021-07-23 19:11'),
  finishTime: new Date('2021-09-01 19:11'),
};

export const timeBetweenOperationInSeconds = 21600;

export const getGanacheConfig = (): Ganache.IProviderOptions => {
  return {
    account_keys_path: path.resolve(__dirname, '../accounts.json'),
    // fork: fs.existsSync(path.resolve(__dirname, '../db')) ? undefined : 'https://bsc-dataseed1.binance.org',
    // fork: 'https://bsc-dataseed1.binance.org',
    fork: 'https://mainnet.infura.io/v3/de45a48fc06f4f49b8c867241f429239',
    networkId: 56,
    fork_block_number: 12096424,
    time: fs.existsSync(path.resolve(__dirname, '../db')) ? generationRange.finishTime : generationRange.startTime,
    hardfork: 'istanbul',
    blockTime: 0,
    default_balance_ether: 10000,
    total_accounts: 301,
    seed: 'F8Jn2WgcAw',
    // debug: true,
    // forkCacheSize: 54857600,
    mnemonic: 'catalog forum over nut turkey topic village reduce issue speak enforce diamond capable horror click',
    db_path: path.resolve(__dirname, '../db', 'db'),
  };
};

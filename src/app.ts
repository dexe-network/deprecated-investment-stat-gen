import Ganache from 'ganache-core';
import { stateInitializer } from './utils/stateInit';
import { BaseGenerator } from './generator/baseGenerator';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import { getGanacheConfig } from './utils/ganacheConfig';

const ganacheOptions = getGanacheConfig();
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

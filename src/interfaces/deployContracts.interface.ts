import { Contract } from 'web3-eth-contract';

export interface IDeployResult {
  contract: Contract;
  address: string;
}

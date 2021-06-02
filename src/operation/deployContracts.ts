import { IAccount, IRawTransaction, IState, VENDOR } from '../interfaces/basic.interface';
import fs from 'fs';
import path from 'path';
import 'colors';
import { contractCallErrorHandler } from '../helpers/error.helper';
import { IDeployResult } from '../interfaces/deployContracts.interface';
import { getContract } from '../utils/getContract';
import { Contract } from 'web3-eth-contract';
import { sendTransaction } from '../utils/sendTransaction';

export class DeployContracts {
  account: IAccount;

  constructor(private state: IState) {
    this.account = state.accounts.traders[0];
  }

  public async run(): Promise<void> {
    const traderPoolUpgradeableBeacon = await this.deployContract('TraderPoolUpgradeable', this.account).then(
      contract1 => {
        return this.deployContract('UpgradeableBeacon', this.account, [contract1.address]);
      },
    );
    const poolLiquidityTokenUpgradeableBeacon = await this.deployContract(
      'PoolLiquidityTokenUpgradeable',
      this.account,
    ).then(contract1 => {
      return this.deployContract('UpgradeableBeacon', this.account, [contract1.address]);
    });

    const traderPoolFactoryUpgradeableBeacon = await this.deployContract('TraderPoolFactoryUpgradeable', this.account)
      .then(contract1 => {
        return this.deployContract('UpgradeableBeacon', this.account, [contract1.address]);
      })
      .then(contract2 => {
        return this.deployContract('BeaconProxy', this.account, [
          contract2.address,
          this.state.web3.utils.hexToBytes('0x'),
        ]);
      });

    const paramKeeper = await this.deployContract('ParamKeeper', this.account);

    let defiRouter: Contract;
    let defiFactoryAddress;
    let wethTokenAddress;

    let valuationManager: IDeployResult;
    let automaticExchangeManager: IDeployResult;
    let swapTool: IDeployResult;

    if (this.state.vendor === VENDOR.Ethereum) {
      defiRouter = getContract('IUniswapV2Router02', this.state.baseAddresses.defiSwapRouter, this.state);
      defiFactoryAddress = await defiRouter.methods.factory().call();
      wethTokenAddress = await defiRouter.methods.WETH().call();

      swapTool = await this.deployContract('UniswapExchangeTool', this.account);
      valuationManager = await this.deployContract('UniswapPathFinder', this.account);
      automaticExchangeManager = await this.deployContract('UniswapAutoExchangeTool', this.account);
    } else if (this.state.vendor === VENDOR.BSC) {
      defiRouter = getContract('IPancakeRouter01', this.state.baseAddresses.defiSwapRouter, this.state);
      defiFactoryAddress = await defiRouter.methods.factory().call();
      wethTokenAddress = await defiRouter.methods.WETH().call();

      swapTool = await this.deployContract('PancakeExchangeTool', this.account);
      valuationManager = await this.deployContract('PancakePathFinder', this.account);
      automaticExchangeManager = await this.deployContract('PancakeExchangeTool', this.account);
    }

    this.state.baseAddresses.defiFactory = defiFactoryAddress;
    this.state.deployedAddresses.exchangeTool = swapTool.address;
    this.state.deployedAddresses.traderPoolFactoryUpgradeable = traderPoolFactoryUpgradeableBeacon.address;

    await this.setAssetAutomaticExchangeManager(paramKeeper, automaticExchangeManager);
    await this.setAssetValuationManager(paramKeeper, valuationManager);
    await this.setParamAddress(paramKeeper, 1000, this.state.baseAddresses.defiSwapRouter);
    await this.setParamAddress(paramKeeper, 1001, this.state.baseAddresses.defiFactory);
    // insurance address
    await this.setParamAddress(paramKeeper, 101, this.account.address);
    // dexe commission address
    await this.setParamAddress(paramKeeper, 102, this.account.address);
    await this.addAssetManager(paramKeeper, swapTool.address);

    //address _admin, address _traderContractBeaconAddress,address _pltBeaconAddress, address _paramkeeper, address _positionToolManager, address _weth
    await this.initializeFactory(
      traderPoolFactoryUpgradeableBeacon,
      traderPoolUpgradeableBeacon,
      poolLiquidityTokenUpgradeableBeacon,
      paramKeeper,
      wethTokenAddress,
    );
    await this.setParamAddress(paramKeeper, 1, traderPoolFactoryUpgradeableBeacon.address);
    console.log('Factory inited'.bgMagenta.bold);
  }

  private async initializeFactory(
    traderPoolFactoryUpgradeable: IDeployResult,
    traderPoolUpgradeable: IDeployResult,
    poolLiquidity: IDeployResult,
    paramKeeper: IDeployResult,
    wethTokenAddress: string,
  ): Promise<void> {
    const contract = getContract('TraderPoolFactoryUpgradeable', traderPoolFactoryUpgradeable.address, this.state);
    const txCount = await this.state.web3.eth.getTransactionCount(this.account.address);
    const rawTransaction: IRawTransaction = {
      from: this.account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: traderPoolFactoryUpgradeable.address,
      value: this.state.web3.utils.toHex(0),
      data: contract.methods
        .initialize(
          this.account.address,
          traderPoolUpgradeable.address,
          poolLiquidity.address,
          paramKeeper.address,
          paramKeeper.address,
          wethTokenAddress,
        )
        .encodeABI(),
    };
    await sendTransaction(rawTransaction, this.account.secretKey, 'initializeFactory', this.state);
  }

  private async addAssetManager(paramKeeper: IDeployResult, address: string): Promise<void> {
    const txCount = await this.state.web3.eth.getTransactionCount(this.account.address);
    const rawTransaction: IRawTransaction = {
      from: this.account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: paramKeeper.address,
      value: this.state.web3.utils.toHex(0),
      data: paramKeeper.contract.methods.addAssetManager(address).encodeABI(),
    };
    await sendTransaction(rawTransaction, this.account.secretKey, 'addAssetManager', this.state);
  }

  private async setParamAddress(paramKeeper: IDeployResult, index: number, address: string): Promise<void> {
    const txCount = await this.state.web3.eth.getTransactionCount(this.account.address);
    const rawTransaction: IRawTransaction = {
      from: this.account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: paramKeeper.address,
      value: this.state.web3.utils.toHex(0),
      data: paramKeeper.contract.methods.setParamAddress(this.state.web3.utils.toHex(index), address).encodeABI(),
    };
    await sendTransaction(rawTransaction, this.account.secretKey, 'setParamAddress', this.state);
  }

  private async setAssetValuationManager(paramKeeper: IDeployResult, valuationManager: IDeployResult): Promise<void> {
    const txCount = await this.state.web3.eth.getTransactionCount(this.account.address);
    const rawTransaction: IRawTransaction = {
      from: this.account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: paramKeeper.address,
      value: this.state.web3.utils.toHex(0),
      data: paramKeeper.contract.methods.setAssetValuationManager(valuationManager.address).encodeABI(),
    };
    await sendTransaction(rawTransaction, this.account.secretKey, 'setAssetValuationManager', this.state);
  }

  private async setAssetAutomaticExchangeManager(
    paramKeeper: IDeployResult,
    automaticExchangeManager: IDeployResult,
  ): Promise<void> {
    const txCount = await this.state.web3.eth.getTransactionCount(this.account.address);
    const rawTransaction: IRawTransaction = {
      from: this.account.address,
      nonce: this.state.web3.utils.toHex(txCount),
      gasPrice: this.state.web3.utils.toHex(this.state.config.gasPrice),
      gasLimit: this.state.web3.utils.toHex(this.state.config.gasLimit),
      to: paramKeeper.address,
      value: this.state.web3.utils.toHex(0),
      data: paramKeeper.contract.methods.setAssetAutomaticExchangeManager(automaticExchangeManager.address).encodeABI(),
    };
    await sendTransaction(rawTransaction, this.account.secretKey, 'setAssetAutomaticExchangeManager', this.state);
  }

  private async deployContract(fileName: string, account: IAccount, deployArg: any[] = []): Promise<IDeployResult> {
    try {
      const source = fs.readFileSync(path.resolve(__dirname, '../contracts', `${fileName}.json`));
      const contract = JSON.parse(source.toString());
      const abi = contract.abi;
      const code = contract.bytecode;
      const SampleContract = new this.state.web3.eth.Contract(abi);
      const deployedContract = await SampleContract.deploy({
        data: code,
        arguments: deployArg,
      })
        .send({
          from: account.address,
          gasPrice: this.state.config.gasPrice.toString(),
          gas: this.state.config.gasLimit,
        })
        .on('transactionHash', r => {
          console.log('Deploy Contract'.bgYellow.bold, fileName.bgCyan.bold, 'TX hash:'.magenta.bold, r);
        });
      return {
        contract: deployedContract,
        address: deployedContract.options.address,
      };
    } catch (e) {
      contractCallErrorHandler(e);
    }
  }
}

import BigNumber from 'bignumber.js';

export const buildBalanceTransformer = (value: BigNumber, decimals: number): BigNumber => {
  if (!value || !(typeof decimals === 'number')) {
    return new BigNumber(0);
  }

  const balance = value;
  const decimalsBN = new BigNumber(decimals);
  const divisor = new BigNumber(10).pow(decimalsBN);
  const beforeDecimal = balance.div(divisor);
  return beforeDecimal;
};

export const parsedBalanceToRaw = (value: BigNumber, decimals: number): BigNumber => {
  if (!value || !(typeof decimals === 'number')) {
    return new BigNumber(0);
  }

  const balance = value;
  const decimalsBN = new BigNumber(decimals);
  const divisor = new BigNumber(10).pow(decimalsBN);
  const beforeDecimal = balance.multipliedBy(divisor);
  return beforeDecimal;
};

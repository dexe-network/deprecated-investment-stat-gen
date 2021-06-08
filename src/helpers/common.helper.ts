export function sleeper(ms) {
  return function (x): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}

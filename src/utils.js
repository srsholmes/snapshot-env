// @flow

export const sequence = (fns: Array<() => Promise<T>>) =>
  fns.reduce(
    (promise, func) => promise.then(res => func().then(x => res.concat(x))),
    Promise.resolve([])
  );
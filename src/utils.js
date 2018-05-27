export const sequence = fns =>
  fns.reduce(
    (promise, func) => promise.then(res => func().then(x => res.concat(x))),
    Promise.resolve([])
  );

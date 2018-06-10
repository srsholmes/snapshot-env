// @flow

export const getSortedDeps = () => {
  const deps = require('../package.json');
  const expected = [
    ...Object.keys(deps.dependencies),
    ...Object.keys(deps.devDependencies),
  ].sort();
  return expected;
};

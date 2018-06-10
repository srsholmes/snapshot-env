// @flow

import runBuildSteps from '../src/build';
import { getSortedDeps } from './utils';

describe('runBuildSteps', async () => {
  it('Runs the correct build steps', async () => {
    const config = {
      port: 8000,
      build: 'echo "Build Test"',
      commit: 'commit',
      output: 'test',
    };
    const actual = await runBuildSteps(config, getSortedDeps());
    console.log('(((((((((((((((((');
    console.log(actual);
  });
});

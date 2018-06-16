// @flow

import runBuildSteps from '../src/build';
import { getSortedDeps } from './utils';

describe('runBuildSteps', async () => {
  it('Runs the correct build steps', async () => {
    const config = {
      port: 8000,
      build: 'echo "Hello test"',
      commit: 'commit',
      output: 'test',
    };
    const actual = await runBuildSteps(config, getSortedDeps());
    console.log({ actual })
    expect(actual).toBeTruthy();
  });
});

// @flow
import { pathExists } from 'fs-extra';
import { copyBuildDir, getDependencies } from '../src/files';
import { getSortedDeps } from './utils';

describe('getDependencies', async () => {
  it('Returns the correct deps', async () => {
    const actual = await getDependencies();
    const expected = getSortedDeps();
    expect(actual).toEqual(expected);
  });
});

describe('copyBuildDir', async () => {
  it('Copies the build directory and returns the directory', async () => {
    const actual = await copyBuildDir({ output: 'test' });
    const outputPath = await pathExists(actual);
    expect(outputPath).toBeTruthy();
    expect(actual.includes('node_modules/snapshot-env')).toBeTruthy();
  });
});

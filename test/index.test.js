// @flow
import { pathExists } from 'fs-extra';
import {
  PORT,
  SNAPSHOT,
  TEMP_DIR,
  getNeededConfig,
  getUnsetConfigValues,
  getSnapshotConfig,
} from '../src/index';

describe('Main functions and constants', async () => {
  it('Constants are not changed', async () => {
    const portConst = 3000;
    const snapshotConst = 'snapshot';
    const tempDirConst = 'node_modules/snapshot-env/src/snapshots';
    expect(portConst).toEqual(PORT);
    expect(snapshotConst).toEqual(SNAPSHOT);
    expect(tempDirConst).toEqual(TEMP_DIR);
  });

  it('getUnsetConfigValues', async () => {
    const actual = getUnsetConfigValues({
      build: null,
      port: 300,
      commit: null,
      output: 'test',
    });
    const expected = ['build', 'commit'];
    expect(actual).toEqual(expected);
  });

  it('getSnapshotConfig true', async () => {
    const actual = await getSnapshotConfig(true);
    const expected = {
      build: 'snapshot:test:build',
      port: 1000,
      commit: 'testCommit',
      output: 'testOutput',
    };

    expect(actual).toEqual(expected);
  });

  it('getSnapshotConfig false', async () => {
    const actual = await getSnapshotConfig(false);
    const expected = null;
    expect(actual).toEqual(expected);
  });
});

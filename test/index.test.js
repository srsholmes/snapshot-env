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

  it('getNeededConfig', async () => {
    const actual = getNeededConfig(['build']);
    const expected = 'hello';
    expect(actual).toEqual(expected);
  });

  it('getUnsetConfigValues', async () => {
    const actual = getUnsetConfigValues();
    const expected = 'hello';
    expect(actual).toEqual(expected);
  });

  it('getSnapshotConfig', async () => {
    const actual = getSnapshotConfig();
    const expected = 'hello';
    expect(actual).toEqual(expected);
  });
});

// @flow

import { pathExists } from 'fs-extra';
import getConfigFromUser from './inquirer';
import {
  warnIfUncommittedChanges,
  checkoutGitCommit,
  getCurrentGitBranch,
  revertStash,
  fetchLatestRemote,
} from './git';
import runBuildSteps from './build';
import { error, info, log } from './log';
import { getDependencies } from './files';
import { exitHandler, sequence } from './utils';

export type Config = {
  build: string,
  commit: string,
  output: string,
  server: string,
};

type UserConfig = {
  build: ?string,
  commit: ?string,
  output: ?string,
};

export const PORT = 3000;
export const SNAPSHOT = 'snapshot';
export const TEMP_DIR = `node_modules/snapshot-env/${__dirname
  .split('/')
  .pop()}/${SNAPSHOT}s`;

const getNeededConfig = async (arr: Array<string>) => {
  const fns = arr.map(x => () => getConfigFromUser(x));
  const res = await sequence(fns);
  return res.reduce((acc, curr, i) => ({ ...acc, [arr[i]]: curr }), {});
};

const runBuildWizard = async (config: UserConfig) => {
  const unsetConfigValues = Object.entries(config)
    .filter(([_, val]) => !val)
    .map(x => x[0]);

  const neededConfig = await getNeededConfig(unsetConfigValues);
  const finalConfig = {
    ...config,
    ...neededConfig,
  };
  log(info('Config: ', JSON.stringify(finalConfig)));
  const deps = await getDependencies();
  await checkoutGitCommit(finalConfig.commit);
  await runBuildSteps(finalConfig, deps);
};

const getSnapshotConfig = async (hasConfig: boolean) =>
  // eslint-disable-next-line no-undef,import/no-dynamic-require,global-require
  hasConfig ? require(`${process.cwd()}/${SNAPSHOT}.json`) : null;

export const snapshot = async () => {
  const userStashed = await warnIfUncommittedChanges();
  await fetchLatestRemote();
  const currentBranch = await getCurrentGitBranch();
  try {
    const configStr = `./${SNAPSHOT}.json`;
    const hasConfig = await pathExists(configStr, 'utf8');
    const userConfig = await getSnapshotConfig(hasConfig);
    const config = {
      build: null,
      commit: null,
      output: null,
      ...userConfig,
    };

    await runBuildWizard(config);
  } catch (err) {
    log(error(err));
  } finally {
    if (userStashed) {
      await revertStash();
    }
  }
  ['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(x =>
    process.on(
      x,
      exitHandler.bind(null, { cleanup: true, exit: true, currentBranch })
    )
  );
};

// @flow

import { pathExists, readFile, remove } from 'fs-extra';
import getConfigFromUser from './inquirer';
import {
  warnIfUncommittedChanges,
  checkoutGitCommit,
  getCurrentGitBranch,
  revertGitCheckout,
} from './git';
import runBuildSteps from './build';
import { error, go, info, log, separator } from './log';
import { getDependencies } from './files';
import { sequence } from './utils';

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

export type PackageJson = {
  dependencies?: any,
  devDependencies?: any,
};

export const PORT = 3000;
export const SNAPSHOT = 'snapshot';
export const TEMP_DIR = `node_modules/snapshot-env/${__dirname
  .split('/')
  .pop()}/${SNAPSHOT}s`;

process.stdin.resume();

async function exitHandler(options, err) {
  if (options.cleanup) log('cleaning up...');
  if (err) log(err.stack);
  separator();
  log(go('Removing snapshot directory...'));
  await remove(TEMP_DIR);
  separator();
  if (options.exit) process.exit();
}

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(x =>
  process.on(x, exitHandler.bind(null, { cleanup: true, exit: true }))
);

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
  await checkoutGitCommit(finalConfig.commit);
  const deps = await getDependencies();
  await runBuildSteps(finalConfig, deps);
};

const getSnapshotConfig = async (hasConfig: boolean) => {
  if (hasConfig) {
    const configFile = await readFile(`./${SNAPSHOT}.json`, 'utf8');
    return JSON.parse(configFile);
  }
  return null;
};

// TODO: Go down a single route, using inquirer if the config prop is not found.
export const snapshot = async () => {
  // await warnIfUncommittedChanges();
  const currentBranch = await getCurrentGitBranch();
  try {
    const configStr = `./${SNAPSHOT}.json`;
    const hasConfig: boolean = await pathExists(configStr, 'utf8');
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
    await revertGitCheckout(currentBranch);
  }
};

// @flow

import { readFile, pathExists, remove } from 'fs-extra';
import { runInquirer } from './inquirer';
import {
  getCurrentGitBranch,
  checkoutGitCommit,
  warnIfUncommittedChanges,
  revertGitCheckout,
} from './git';
import runBuildSteps from './build';
import { info, go, error, separator, log } from './log';
import { getDependencies } from './files';

export type Config = {
  build: string,
  commit: string,
  output: string,
  server?: string,
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

const runConfigSteps = async (config: Config) => {
  log(info('CONFIG File found: ', JSON.stringify(config)));
  await checkoutGitCommit(config.commit);
  const deps = await getDependencies();
  await runBuildSteps(config, deps);
};

export const snapshot = async () => {
  await warnIfUncommittedChanges();
  const currentBranch = await getCurrentGitBranch();
  try {
    // TODO: validate config file
    const config = `./${SNAPSHOT}.json`;
    const hasConfig: string = await pathExists(config, 'utf8');
    if (hasConfig) {
      const configFIle: string = await readFile(config, 'utf8');
      await runConfigSteps(JSON.parse(configFIle));
    } else {
      await runInquirer();
    }
  } catch (err) {
    log(error(err));
  } finally {
    await revertGitCheckout(currentBranch);
  }
};

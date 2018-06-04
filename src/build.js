// @flow

import { promisify } from 'util';
import { pathExists } from 'fs-extra';
import type { Config } from './index';
import { copyBuildDir, getDependencies } from './files';
import { useLocalServer, createLocalServer } from './server';
import { error, separator, log } from './log';

const exec = promisify(require('child_process').exec);

const runBuildStep = async (config: Config) => {
  separator();
  log('Running build process...');
  const { build } = config;
  const { stdout, stderr } = await exec(`${build}`, {
    maxBuffer: 1024 * 8000,
  });
  log(('Output:', stdout));
  log(error('stderr:', stderr));
};

const checkForNodeModules = async deps => {
  log('Checking dependencies');
  const folderExists = await pathExists(`${process.cwd()}/node_modules`);
  const newDeps = await getDependencies();
  if (!folderExists || newDeps.toString() !== deps.toString()) {
    log('Installing dependencies, this might take a while 🕐');
    await exec(`npm install`);
  }
  log('Dependencies Installed');
};

const runBuildSteps = async (config: Config, deps: Array<string>) => {
  await checkForNodeModules(deps);
  await runBuildStep(config);
  const directoryToHost = await copyBuildDir(config);
  if (config.server) {
    await useLocalServer(config.server);
  } else {
    await createLocalServer(directoryToHost, config.port);
  }
};

export default runBuildSteps;

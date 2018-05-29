// @flow
import { copy, readFile } from 'fs-extra';
import { promisify } from 'util';
import { type Config, TEMP_DIR } from './index';
import { info, separator, log } from './log';

const exec = promisify(require('child_process').exec);

export const copyBuildDir = async (config: Config) => {
  separator();
  log(info('Copying output directory...........!'));
  const { stdout } = await exec(`git log --pretty=format:'%h' -n 1`);
  const dir = `${TEMP_DIR}/${stdout}`;
  await copy(config.output, dir);
  log(info('Directory copied!'));
  return dir;
};

export const getDependencies = async () => {
  // Use read file here to get round the require cache, as we have already required the packgae.json
  const file: string = await readFile('./package.json', 'utf8');
  const json = JSON.parse(file);
  const { dependencies, devDependencies } = json;
  const deps = [
    ...Object.keys(dependencies || {}),
    ...Object.keys(devDependencies || {}),
  ].sort();
  return deps;
};

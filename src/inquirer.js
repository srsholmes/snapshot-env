// @flow
import inquirer from 'inquirer';
import { readFile } from 'fs-extra';
import { log } from './log';

const simpleGit = require('simple-git/promise')();

export const askToStashChanges = async (): Promise<string> => {
  const { stash } = await inquirer.prompt([
    {
      type: 'list',
      name: 'stash',
      choices: ['yes', 'no'],
      message:
        'Uncommited changes detected, would you like to stash your changes?',
      validate: value => true,
      // TODO: Validate the build command form the package json.
    },
  ]);

  return stash;
};

const getBuildConfig = async (): Promise<string> => {
  const pkgJsonFile = await readFile('./package.json', 'utf8');
  const { scripts } = JSON.parse(pkgJsonFile);
  const { build } = await inquirer.prompt([
    {
      type: 'list',
      name: 'build',
      choices: Object.keys(scripts),
      message: 'What is your build command ?',
      validate: value => true,
      // TODO: Validate the build command form the package json.
    },
  ]);

  return `npm run ${build}`;
};

const getGitConfig = async (): Promise<string> => {
  const { branches } = await simpleGit.branch();
  const { branch } = await inquirer.prompt([
    {
      type: 'list',
      name: 'branch',
      pageSize: 20,
      message: 'What branch would you like to snapshot ?',
      choices: Object.keys(branches),
    },
  ]);

  return branch;
};

const getOutputConfig = async (): Promise<string> => {
  const { output } = await inquirer.prompt([
    {
      type: 'input',
      name: 'output',
      message: 'What is your output directory ?',
      // Watch for new folders being created to read output?
      validate: value => true,
    },
  ]);
  return output;
};

const getConfigFromUser = async (key: string) => {
  switch (key) {
    case 'build': {
      log('Build config missing');
      const build = await getBuildConfig();
      return build;
    }
    case 'commit': {
      log('Commit config missing');
      const branch = await getGitConfig();
      return branch;
    }
    case 'output': {
      log('output config missing');
      const branch = await getOutputConfig();
      return branch;
    }
    default:
      return 'lol';
  }
};

export default getConfigFromUser;

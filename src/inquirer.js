// @flow
import inquirer from 'inquirer';
import { getDependencies } from './files';
import { checkoutGitCommit } from './git';
import runBuildSteps from './build';

const simpleGit = require('simple-git/promise')();


const runInquirer = async () => {
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

  const deps = await getDependencies();
  await checkoutGitCommit(branch);

  const { build } = await inquirer.prompt([
    {
      type: 'input',
      name: 'build',
      message: 'What is your build command ?',
      validate: value => true,
      // TODO: Validate the build command form the package json.
    },
  ]);
  const { output } = await inquirer.prompt([
    {
      type: 'input',
      name: 'output',
      message: 'What is your output directory ?',
      // Watch for new folders being created to read output?
      validate: value => true,
    },
  ]);
  const configObj = {
    build,
    commit: branch,
    output,
  };
  await runBuildSteps(configObj, deps);
};

module.exports = {
  runInquirer,
};

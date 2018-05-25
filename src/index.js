// @flow
const chalk = require('chalk');
const {
  readFile,
  copy,
  exists,
  copyFile,
  pathExists,
  appendFile,
  remove,
} = require('fs-extra');
const { promisify } = require('util');
const { createServer } = require('http-server');
const exec = promisify(require('child_process').exec);
const { fork } = require('child_process');
const inquirer = require('inquirer');
const simpleGit = require('simple-git/promise')();
const ngrok = require('ngrok');

const info = chalk.blue;
const go = chalk.green;
const error = chalk.bold.red;
const { log } = console;
const separator = () => log('*'.repeat(80));

type Config = {
  build: string,
  server: string,
  output: string,
  commit: string,
};

const PORT = 3000;
const SNAPSHOT = 'snapshot';
const TEMP_DIR = `node_modules/snapshot-env/${__dirname
  .split('/')
  .pop()}/${SNAPSHOT}s`;

process.stdin.resume();

async function exitHandler(options, err) {
  if (options.cleanup) console.log('cleaning up...');
  if (err) console.log(err.stack);
  separator();
  log(go('Removing snapshot directory...'));
  await remove(TEMP_DIR);
  separator();
  if (options.exit) process.exit();
}

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(x =>
  process.on(x, exitHandler.bind(null, { cleanup: true, exit: true }))
);

const getCurrentGitBranch = async () => {
  log(info(`Getting current git branch`));
  const { stdout } = await exec(`git rev-parse --abbrev-ref HEAD`);
  return stdout;
};

const checkoutGitCommit = async commit => {
  if (commit) {
    log(info(`Checking out commit: ${commit}`));
    const res = await exec(`git checkout -f ${commit}`).stdout;
    log(('Output:', res));
  }
};

const warnIfUncommittedChanges = async () => {
  log(info(`Checking to see if current branch has unstaged changes...`));
  const { stdout } = await exec(
    `git diff-index --quiet HEAD -- || echo "untracked"  >&1`
  );
  if (stdout) {
    throw new Error(`You have uncommitted changes which would be lost by creating a snapshot of a different branch \n
      Please either stash or commit your changes before creating a snapshot of a specific commit.`);
  }
};

const revertGitCheckout = async branch => {
  if (branch) {
    log(info(`Reverting back to previous branch: ${branch}`));
    const { stdout } = await exec(`git checkout ${branch}`);
    log(('Output:', stdout));
  }
};

const runBuildStep = async config => {
  separator();
  log('Running build process...');
  const { build } = config;
  const { stdout, stderr } = await exec(`${build}`, {
    maxBuffer: 1024 * 8000,
  });
  log(('Output:', stdout));
  log(error('stderr:', stderr));
};

const copyServerFile = async serverFile => {
  const path = `${process.cwd()}/${serverFile}`;
  const serverExists = await exists(path);
  if (serverExists) {
    await copyFile(serverFile, `${process.cwd()}/${SNAPSHOT}/${serverFile}`);
  } else {
    throw new Error('Specified server in config not found');
  }
};

function runScript(scriptPath, cb) {
  let invoked = false;
  const process = fork(scriptPath);
  process.on('error', err => {
    if (invoked) return;
    invoked = true;
    cb(err);
  });

  process.on('exit', code => {
    if (invoked) return;
    invoked = true;
    const err = code === 0 ? null : new Error(`exit code ${code}`);
    cb(err);
  });
}

const startServer = async serverFile => {
  const path = `${process.cwd()}/${serverFile}`;
  const server = fork(path);
  log(info(server));
  runScript(serverFile, err => {
    if (err) throw err;
  });
  log(info('Custom Server started'));
};

const ignoreSnapshot = async () => {
  separator();
  const name = '.gitignore';
  const file = await readFile(name, 'utf8');
  const isIgnored = file.split('\n').find(x => x === 'snapshot');
  if (!isIgnored) {
    log(info('Adding snapshot to gitignore...'));
    await appendFile(name, '\nsnapshot\n');
    await exec(`git add . && git commit -m 'added snapshot to .gitignore'`);
  }
  log(info('Snapshot directory added to gitignore'));
};

const copyBuildDir = async config => {
  separator();
  log(info('Copying output directory...........!'));
  const { stdout } = await exec(`git log --pretty=format:'%h' -n 1`);
  const dir = `${TEMP_DIR}/${stdout}`;
  await copy(config.output, dir);
  log(info('Directory copied!'));
  return dir;
};

const useLocalServer = async server => {
  separator();
  log('Custom server found, copying server');
  await copyServerFile(server);
  await startServer(server);
  log(info(`Custom server started....`));
};

const createLocalServer = async dir => {
  separator();
  log('No custom server found, creating static hosted server');
  createServer({
    root: dir,
  }).listen(parseInt(PORT, 10));
  const externalServer = await ngrok.connect(PORT);

  log(go(`View local deploy here: http://localhost:${PORT}`));
  separator();
  log(go(`Or view externally here: ${externalServer}`));
};

const runBuildSteps = async (config: Config) => {
  await runBuildStep(config);
  const directoryToHost = await copyBuildDir(config);
  if (config.server) {
    await useLocalServer(config.server);
  } else {
    await createLocalServer(directoryToHost);
  }
};

const runConfigSteps = async config => {
  log(info('CONFIG File found: ', JSON.stringify(config)));
  await checkoutGitCommit(config.commit);
  await runBuildSteps(config);
};

const runInquirer = async () => {
  const { branches } = await simpleGit.branch();
  const { branch } = await inquirer.prompt([
    {
      type: 'list',
      name: 'branch',
      message: 'What branch would you like to snapshot ?',
      choices: Object.keys(branches),
    },
  ]);
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
  await runBuildSteps(configObj);
};

const snapshot = async () => {
  await ignoreSnapshot();
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

module.exports = {
  snapshot,
};

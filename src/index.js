// @flow
const chalk = require('chalk');
const {
  readFileSync,
  copy,
  exists,
  copyFile,
  readFile,
  appendFile,
  remove,
} = require('fs-extra');
const { promisify } = require('util');
const { createServer } = require('http-server');
const exec = promisify(require('child_process').exec);
const { fork } = require('child_process');
const inquirer = require('inquirer');
const simpleGit = require('simple-git/promise')();

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
const SNAPSHOT = 'snapshot';
const ENV_PATH = `./${SNAPSHOT}.json`;
const TEMP_DIR = `node_modules/snapshot-env/${__dirname
  .split('/')
  .pop()}/${SNAPSHOT}s`;

const PORT = 3000;
const CONFIG_FILE: string = readFileSync(ENV_PATH, 'utf8');
const CONFIG: Config = JSON.parse(CONFIG_FILE);

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

log(info('CONFIG: ', JSON.stringify(CONFIG)));

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

const warnIfUncommittedChanges = async commit => {
  if (commit) {
    log(info(`Checking to see if current branch has unstaged changes...`));
    const { stdout } = await exec(
      `git diff-index --quiet HEAD -- || echo "untracked"  >&1`
    );
    if (stdout) {
      throw new Error(`You have uncommitted changes which would be lost by creating a snapshot of a different branch \n
      Please either stash or commit your changes before creating a snapshot of a specific commit.`);
    }
  }
};

const revertGitCheckout = async branch => {
  if (branch) {
    log(info(`Reverting back to previous branch: ${branch}`));
    const { stdout } = await exec(`git checkout ${branch}`);
    log(('Output:', stdout));
  }
};

const runBuildStep = async () => {
  separator();
  log('Running build process...');
  const { build } = CONFIG;
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
  const server = await fork(path);
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

const copyBuildDir = async () => {
  separator();
  log(info('Copying output directory...........!'));
  const { stdout } = await exec(`git log --pretty=format:'%h' -n 1`);
  const dir = `${TEMP_DIR}/${stdout}`;
  await copy(CONFIG.output, dir);
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
  log(go(`View local deploy here: http://localhost:${PORT}`));
};

// TODO: Make this snapshots directory an option.
// TODO: Either checkout commit from snapshot json or lauch inquirer to checkout a branch.

const snapshot = async () => {
  const { server, commit } = CONFIG;
  const currentBranch = await getCurrentGitBranch();
  try {
    await ignoreSnapshot();
    await warnIfUncommittedChanges(commit);
    if (commit) {
      await checkoutGitCommit(commit);
    } else {
      const { branches } = await simpleGit.branch();
      const branchName = await inquirer.prompt([
        {
          type: 'list',
          name: 'size',
          message: 'What branch would you like to snapshot?',
          choices: Object.keys(branches),
        },
      ]);
      await checkoutGitCommit(branchName.size);
    }
    await runBuildStep();
    const directoryToHost = await copyBuildDir();
    if (server) {
      await useLocalServer(server);
    } else {
      await createLocalServer(directoryToHost);
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

// @flow
const chalk = require('chalk');
const {
  readFileSync,
  copy,
  exists,
  copyFile,
  readFile,
  remove,
  appendFile,
} = require('fs-extra');
const { promisify } = require('util');
const { createServer } = require('http-server');
const exec = promisify(require('child_process').exec);
const { fork } = require('child_process');

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
const TEMP_DIR = `./${SNAPSHOT}`;
const PORT = 3000;
const CONFIG_FILE: string = readFileSync(ENV_PATH, 'utf8');
const CONFIG: Config = JSON.parse(CONFIG_FILE);

log(info('CONFIG: ', JSON.stringify(CONFIG)));
const { commit } = CONFIG;
let currentBranch = null;

const checkoutGitCommit = async () => {
  if (commit) {
    log(info(`Checking out commit: ${commit}`));
    const { stdout } = await exec(`git rev-parse --abbrev-ref HEAD`);
    currentBranch = stdout;
    const res = await exec(`git checkout -f ${commit}`).stdout;
    log(('Output:', res));
  }
};

const warnIfUncommitedChanges = async () => {
  if (commit) {
    log(info(`Checking to see if current branch has unstaged changes...`));
    const { stdout } = await exec(
      `git diff-index --quiet HEAD -- || echo "untracked"  >&1`,
    );
    if (stdout) {
      throw new Error(`You have uncommitted changes which would be lost by creating a snapshot of a different branch \n
      Please either stash or commit your changes before creating a snapshot of a specific commit.`);
    }
  }
};

const revertGitCheckout = async () => {
  if (currentBranch) {
    log(info(`Reverting back to previous branch: ${currentBranch}`));
    const { stdout } = await exec(`git checkout ${currentBranch}`);
    currentBranch = null;
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
  // TODO: Add in snapshot json to prevent error of 'cannot checkout' if snapshot json has changed and isnt commited.
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
  await copy(CONFIG.output, TEMP_DIR);
  log(info('Directory copied!'));
};

const useLocalServer = async server => {
  separator();
  log('Custom server found, copying server');
  await copyServerFile(server);
  await startServer(server);
  log(info(`Custom server started....`));
};

const createLocalServer = async () => {
  separator();
  log('No custom server found, creating static hosted server');
  createServer({ root: `${TEMP_DIR}/` }).listen(parseInt(PORT, 10));
  log(go(`View local deploy here: http://localhost:${PORT}`));
};

const snapshot = async () => {
  try {
    await ignoreSnapshot();
    await warnIfUncommitedChanges();
    await checkoutGitCommit();
    await runBuildStep();
    await copyBuildDir();
    const { server } = CONFIG;
    if (server) {
      await useLocalServer(server);
    } else {
      await createLocalServer();
    }
    await revertGitCheckout();
  } catch (err) {
    await revertGitCheckout();
    log(error(err));
  }
};

module.exports = {
  snapshot,
};

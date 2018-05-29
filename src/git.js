// @flow
import { promisify } from 'util';
import { info, log } from './log';
import { askToStashChanges } from './inquirer';

const exec = promisify(require('child_process').exec);

export const getCurrentGitBranch = async () => {
  log(info(`Getting current git branch`));
  const { stdout } = await exec(`git rev-parse --abbrev-ref HEAD`);
  return stdout;
};

export const fetchLatestRemote = async () => {
  log(info(`Fetching latest remote...`));
  const { stdout } = await exec(`git fetch -ap`);
  return stdout;
};

type BranchOrCommitId = string;

export const checkoutGitCommit = async (checkout: BranchOrCommitId) => {
  if (checkout) {
    log(info(`Checking out commit: ${checkout}`));
    const isRemote = checkout.includes('remotes/');
    const replacedRemote = checkout.replace('remotes/', '');
    await exec(`git checkout -f ${isRemote ? replacedRemote : checkout}`);
  }
};

export const revertStash = async () => {
  await exec(`git stash pop`);
};

export const warnIfUncommittedChanges = async () => {
  log(info(`Checking to see if current branch has unstaged changes...`));
  const { stdout } = await exec(
    `git diff-index --quiet HEAD -- || echo "untracked"  >&1`
  );
  if (stdout) {
    const userStash = await askToStashChanges();
    if (userStash === 'yes') {
      await exec(`git stash`);
      return true;
    }
    throw new Error(`You have uncommitted changes which would be lost by creating a snapshot of a different branch \n
      Please either stash or commit your changes before creating a snapshot of a specific commit.`);
  }
};

export const revertGitCheckout = async (branch: string) => {
  if (branch) {
    log(info(`Reverting back to previous branch: ${branch}`));
    const { stdout } = await exec(`git checkout ${branch}`);
    log(('Output:', stdout));
  }
};

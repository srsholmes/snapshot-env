import { remove } from 'fs-extra';
import { TEMP_DIR } from './index';
import { go, log, separator } from './log';
import { revertGitCheckout, revertStash } from './git';

export const sequence = fns =>
  fns.reduce(
    (promise, func) => promise.then(res => func().then(x => res.concat(x))),
    Promise.resolve([])
  );

// Clean up task
process.stdin.resume();

export async function exitHandler(options, err) {
  if (options.cleanup) log('cleaning up...');
  if (err) log(err.stack);
  separator();
  log(go('Removing snapshot directory...'));
  await remove(TEMP_DIR);
  separator();
  await revertGitCheckout(options.currentBranch);
  if (options.userStashed) {
    await revertStash();
  }
  if (options.exit) process.exit();
}

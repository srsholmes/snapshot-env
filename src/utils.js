import { remove } from 'fs-extra';
import { TEMP_DIR } from './index';
import { log, separator, info } from './log';

export const sequence = fns =>
  fns.reduce(
    (promise, func) => promise.then(res => func().then(x => res.concat(x))),
    Promise.resolve([]),
  );

// Clean up task
process.stdin.resume();

export async function exitHandler(options, err) {
  if (options.cleanup) log(info('cleaning up......'));
  if (err) log(err.stack);
  separator();
  log(info('Removing snapshot directory......'));
  await remove(TEMP_DIR);
  separator();
  if (options.exit) process.exit();
}

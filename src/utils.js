import { remove } from 'fs-extra';
import { TEMP_DIR } from './index';
import { go, log, separator } from './log';

export const sequence = fns =>
  fns.reduce(
    (promise, func) => promise.then(res => func().then(x => res.concat(x))),
    Promise.resolve([])
  );

// Clean up task
process.stdin.resume();

async function exitHandler(options, err) {
  if (options.cleanup) log('cleaning up...');
  if (err) log(err.stack);
  separator();
  log(go('Removing snapshot directory...'));
  await remove(TEMP_DIR);
  separator();
  if (options.exit) process.exit();
}

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(x =>
  process.on(x, exitHandler.bind(null, { cleanup: true, exit: true }))
);

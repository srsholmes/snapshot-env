// @flow

import { exists, copyFile } from 'fs-extra';
import { createServer } from 'http-server';
import { networkInterfaces } from 'os';
import { fork } from 'child_process';
import ngrok from 'ngrok';
import { SNAPSHOT } from './index';
import { info, go, separator, log } from './log';
import { prepareUrls } from 'react-dev-utils/WebpackDevServerUtils';

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

const startServer = async (serverFile: string) => {
  const path = `${process.cwd()}/${serverFile}`;
  fork(path);
  runScript(serverFile, err => {
    if (err) throw err;
  });
  log(info('Custom Server started'));
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

export const useLocalServer = async (server: string) => {
  separator();
  log('Custom server found, copying server');
  await copyServerFile(server);
  await startServer(server);
  log(info(`Custom server started....`));
};

export const createLocalServer = async (dir: string, port: number) => {
  separator();
  log('No custom server found, creating static hosted server');
  createServer({
    root: dir,
  }).listen(parseInt(port, 10));
  const externalServer = await ngrok.connect(port);
  const serverCOnfig = { appName: 'Test Snapshot', host: '0.0.0.0', port };
  const { lanUrlForConfig, localUrlForBrowser } = prepareUrls('http', serverCOnfig.host, serverCOnfig.port);

  log(go(`View local build here: ${localUrlForBrowser}`));
  log(go(`View local build via IP (for internal networks) here: http://${lanUrlForConfig}:${port}`));
  separator();
  log(go(`Or view externally here: ${externalServer}`));
};

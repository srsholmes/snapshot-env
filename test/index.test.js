import { copyFiles, getConfig } from '../src';

describe('getConfig', async () => {
  it('Find the config file', async () => {
    const test = await getConfig();
    expect(JSON.parse(test)).toEqual({ output: 'public' });
  });
});

describe('copyFiles', async () => {
  it('Copies the files from the output to the snapshot dir', async () => {
    const test = await copyFiles();
    console.log('test', test);
  });
});

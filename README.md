# snapshot-env

A utility to take an environment snapshot and locally host for testing purposes. The output is hosted in its own directory so you can continue developing whilst your branch is being tested.

## Install

```sh
$ npm i -g snapshot-env
```

Or install locally:

```sh
$ npm i snapshot-env
```

## Usage

Place a `snapshot.json` file in your project file with minimum keys of `output` and `build`.

e.g

```
{
  "output": "./public",
  "build": "npm run prod",
}
```

Then run `snapshot-env` in your root directory.

## API.

The following explains the keys in the snapshot.json and their intended use.

`build`

This should be the build command to build your project. It is recommended for this to be your 'production' build step to bundle up as if you were for production. N.B. If you are using [Create React App](https://github.com/facebook/create-react-app) this will bundle your app with a service worker, so make sure you clear your browsers service worker in order to see changes deployed.

`output`

This should be the directory of the output of the `build` command.

`commit`

Optional. Commit ID of the snapshot you would like to 'snapshot'. If commit is specified `snapshot-env` will checkout the commit and create a snapshot of your build at that commit. `snapshot-env` will checkout your existing branch after the snapshot has built so you can continue working.

## License

MIT © [Simon Holmes](https://github.com/srsholmes)

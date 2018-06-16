# snapshot-env

A utility to take an environment snapshot of a statically built site and host locally for testing purposes.

The output is hosted in its own directory on a temporary server so you can continue developing whilst your branch is being tested by other parties.

## Install

```sh
$ npm i -g snapshot-env
```

Or install locally:

```sh
$ npm i snapshot-env --save-dev
```

## Usage

### Method A (Recommended):

Place a `snapshot.json` file in your project file with minimum keys of `output` and `build`.

e.g

```
{
  "output": "public",
  "build": "npm run prod",
}
```

### Method B:

Command line arguments can be used to initialise the snapshot.

The command line options are all optional and will take override the snapshot.json options. The command line options are as follows:

```bash
'-p', or '--port' Port number to host snapshot on.
'-b,' or '--build' 'Build command to build snapshot'
'-c,' or '--commit' 'Commit ID or Branch name to checkout and build'
'-o'' or '--output' 'Output Directory where the build will be made'
```

### Method C:

Run `snapshot-env` in the projects root directory and let the wizard take you through your steps. You will have to do this every time if you do not have a snapshot.json file in the projects root directory. This can be useful for quick testing of prototypes.

![Usage without snapshot json](https://github.com/srsholmes/snapshot-env/blob/develop/usage.gif)

#### Running:

Run `snapshot-env` in the root directory of the project.

## API.

The following explains the keys in the snapshot.json and their intended use.

`build`

This should be the build command to build your project. It is recommended for this to be your 'production' build step as if you were building for production. N.B. If you are using [Create React App](https://github.com/facebook/create-react-app) this will bundle your app with a service worker, so make sure you clear your browsers service worker in order to see changes deployed.

`output`

This should be the directory of the output of the `build` command.

`commit`

Optional. Commit ID of the snapshot you would like to 'snapshot'. If commit is specified `snapshot-env` will checkout the commit and create a snapshot of your build at that commit.

## License

MIT © [Simon Holmes](https://github.com/srsholmes)

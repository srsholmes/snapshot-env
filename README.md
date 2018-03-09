# snapshot-env

A utility to take an environment snapshot and locally host for testing.

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

The `output` key should be the path of your projects compiled build.

The `build` key should be the relevant npm command to build your project.

e.g

```
{
  "output": "./public",
  "build": "npm run prod",
}
```

Then run `snapshot-env` in your root directory.

## License

MIT © [Simon Holmes](https://github.com/srsholmes)

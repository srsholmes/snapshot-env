// @flow
const chalk = require('chalk');

export const info = chalk.magenta;
export const go = chalk.green.underline;
export const error = chalk.bold.red.bold;
export const { log } = console;
export const separator = () => log(chalk.yellow('*'.repeat(80)));

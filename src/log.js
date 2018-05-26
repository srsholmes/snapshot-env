// @flow
const chalk = require('chalk');

export const info = chalk.blue;
export const go = chalk.green;
export const error = chalk.bold.red;
export const { log } = console;
export const separator = () => log('*'.repeat(80));

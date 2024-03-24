import chalk from "chalk";

export const logger = {
  log: (status: string, message: string) =>
    console.log(chalk.green(chalk.bold(status)), chalk.green(message)),
  error: (status: string, message: string) =>
    console.error(chalk.red(chalk.bold(status)), chalk.red(message)),
  warn: (status: string, message: string) =>
    console.warn(chalk.yellow(chalk.bold(status)), chalk.yellow(message)),
};

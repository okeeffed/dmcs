import chalk from "chalk";

export const logger = {
  log: (status: string, message: string) =>
    console.log(chalk.green(chalk.bold(status)), chalk.green(message)),
};

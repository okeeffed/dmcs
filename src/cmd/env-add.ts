import { Command } from "@commander-js/extra-typings";
import prompts from "prompts";
import chalk from "chalk";
import { ddbmUpdateConfig, ddbmReadConfig } from "@/util/fs";
import process from "node:process";

import { logger } from "@/util/logger";

export const envAdd = new Command("env-add")
  .description("Add a new environment to the configuration")
  .option("-n, --name <name>", "Name of the environment")
  .action(async (options) => {
    const config = await ddbmReadConfig();
    const existingEnvs = Object.keys(config.migrations);

    let name: string | undefined = options.name;

    if (!name) {
      // Ask for initial environment
      const result = await prompts(
        {
          type: "text",
          name: "name",
          message: "What is the name of the new environment?",
        },
        {
          onCancel: () => {
            console.log(chalk.yellow("User cancelled"));
            process.exit(0);
          },
        }
      );
      name = result.name;
    }

    if (!name || name.trim() === "") {
      console.log(chalk.red("Invalid environment name provided"));
      process.exit(1);
    }

    if (existingEnvs.includes(name)) {
      console.log(chalk.red("Environment already exists"));
      process.exit(1);
    }

    await ddbmUpdateConfig({
      ...config,
      migrations: {
        ...config.migrations,
        [name]: [],
      },
    });

    logger.log("INFO", `Added environment ${name}`);
  });

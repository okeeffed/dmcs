import { Command } from "@commander-js/extra-typings";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import prompts from "prompts";
import ora from "ora";
import chalk from "chalk";
import process from "node:process";
import { logger } from "@/util/logger";
import { pathFromCwd } from "@/util/fs";
import { getInitConfig, getInitMigration } from "@/util/constants";

export const init = new Command("init")
  .description(
    "Initialise the AWS DDB migrations folder and configuration file"
  )
  .action(async () => {
    // Ask for initial environment
    const { initEnv } = await prompts(
      {
        type: "text",
        name: "initEnv",
        message: "Enter the initial environment name",
        initial: "development",
      },
      {
        onCancel: () => {
          console.log(chalk.yellow("User cancelled"));
          process.exit(0);
        },
      }
    );

    const spinner = ora("Initialising DDBM...").start();

    // Create initial migrations folder
    if (!existsSync(".ddbm")) {
      await mkdir(".ddbm");
    }

    const configFilePath = pathFromCwd(".ddbm.config.json");
    const migrationsFolderPath = pathFromCwd(".ddbm/migrations");

    // Create initial configuration file
    if (!existsSync(configFilePath)) {
      await writeFile(configFilePath, getInitConfig(initEnv));
    }

    // Create initial migration file
    if (!existsSync(migrationsFolderPath)) {
      await mkdir(migrationsFolderPath);
    }

    const migrationFilePath = `.ddbm/migrations/${Date.now()}_init.mjs`;
    await writeFile(pathFromCwd(migrationFilePath), getInitMigration("init"));

    spinner.succeed("Initialised DDBM");
    logger.log("CREATED", ".ddbm.config.js");
    logger.log("CREATED", migrationFilePath);
  });

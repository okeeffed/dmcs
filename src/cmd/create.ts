import { Command } from "@commander-js/extra-typings";
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import prompts from "prompts";
import ora from "ora";
import chalk from "chalk";
import process from "node:process";
import { logger } from "@/util/logger";
import { ddbmReadConfig, pathFromCwd } from "@/util/fs";
import snakeCase from "lodash.snakecase";

export const create = new Command("create")
  .description("Create a new migration file")
  .option("-n, --name <name>", "Name of the migration")
  .option("-e, --env <env>", "Environment to create migration for")
  .action(async (options) => {
    const config = await ddbmReadConfig();
    let ddbmEnv: string | undefined = options.env;
    let migrationName: string | undefined = options.name;

    if (!ddbmEnv) {
      const choices = Object.keys(config.migrations).map((env) => ({
        title: env,
        value: env,
      }));

      // Ask for initial environment
      const result = await prompts(
        {
          type: "select",
          name: "ddbmEnv",
          message: "Which environment would you like to migrate?",
          choices,
        },
        {
          onCancel: () => {
            console.log(chalk.yellow("User cancelled"));
            process.exit(0);
          },
        }
      );
      ddbmEnv = result.ddbmEnv;

      if (!ddbmEnv) {
        console.log(chalk.red("No environment selected"));
        process.exit(1);
      }
    }

    if (!migrationName) {
      // Ask for initial environment
      const result = await prompts(
        {
          type: "text",
          name: "migrationName",
          message: "Which environment would you like to migrate?",
        },
        {
          onCancel: () => {
            console.log(chalk.yellow("User cancelled"));
            process.exit(0);
          },
        }
      );
      migrationName = result.migrationName;

      if (!migrationName || migrationName.length < 1) {
        console.log(chalk.red("Invalid migration name provided"));
        process.exit(1);
      }
    }

    const spinner = ora("Creating new migration file...").start();

    const migrationsFolderPath = pathFromCwd(".ddbm/migrations");

    // Create initial migration file
    if (!existsSync(migrationsFolderPath)) {
      spinner.fail(
        "DDBM migrations folder not found. Run 'ddbm init' to initialise DDBM"
      );
      process.exit(1);
    }

    const migrationFilePath = `.ddbm/migrations/${Date.now()}_${snakeCase(
      migrationName
    )}`;

    await writeFile(pathFromCwd(migrationFilePath), getInitMigration());

    spinner.succeed("Initialised DDBM");
    logger.log("CREATED", ".ddbm.config.js");
    logger.log("CREATED", migrationFilePath);
  });

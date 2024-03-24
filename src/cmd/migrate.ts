import { Command } from "@commander-js/extra-typings";
import prompts from "prompts";
import ora from "ora";
import chalk from "chalk";
import {
  ddbmUpdateConfig,
  pathFromCwd,
  readMigrationFiles,
  ddbmReadConfig,
} from "@/util/fs";
import process from "node:process";

import { logger } from "@/util/logger";

export const migrate = new Command("migrate")
  .description("Run migrations for an environment")
  .option("-e, --env <env>", "Environment to migrate")
  .action(async (options) => {
    const config = await ddbmReadConfig();
    let ddbmEnv: string | undefined = options.env;

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

    if (!config.migrations[ddbmEnv]) {
      console.log(chalk.red(`No migrations found for ${ddbmEnv}`));
      process.exit(1);
    }

    logger.log("INFO", `Migrating ${ddbmEnv} environment`);

    const migrationFiles = await readMigrationFiles();
    const migrationFilesToApply = migrationFiles.filter(
      (file) => !config.migrations[ddbmEnv as string].includes(file)
    );

    if (migrationFilesToApply.length === 0) {
      logger.log("INFO", "No migrations to apply");
      process.exit(0);
    }

    const appliedMigrations: string[] = [];

    for (const file of migrationFilesToApply) {
      const migration = await import(pathFromCwd(`.ddbm/migrations/${file}`));
      await migration.up();
      appliedMigrations.push(file);
      logger.log("APPLIED", file);
    }

    await ddbmUpdateConfig({
      ...config,
      migrations: {
        ...config.migrations,
        [ddbmEnv as string]:
          config.migrations[ddbmEnv as string].concat(appliedMigrations),
      },
    });
  });

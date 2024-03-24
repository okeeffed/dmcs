import { Command } from "@commander-js/extra-typings";
import prompts from "prompts";
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
  .option("-d, --dry-run", "See the plan for migrations before applying")
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

    if (options.dryRun) {
      logger.log("INFO", `Dry run plan for migrating ${ddbmEnv} environment`);
    } else {
      logger.log("INFO", `Migrating ${ddbmEnv} environment`);
    }

    const migrationFiles = await readMigrationFiles();
    const migrationFilesToApply = migrationFiles.filter(
      (file) => !config.migrations[ddbmEnv as string].includes(file)
    );

    if (migrationFilesToApply.length === 0) {
      logger.log("INFO", "No migrations to apply");
      process.exit(0);
    }

    for (const file of migrationFilesToApply) {
      const migration = await import(pathFromCwd(`.ddbm/migrations/${file}`));

      if (options.dryRun) {
        logger.log("PENDING", file);
      } else {
        await migration.up();
        const latestConfig = await ddbmReadConfig();
        await ddbmUpdateConfig({
          ...latestConfig,
          migrations: {
            ...latestConfig.migrations,
            [ddbmEnv as string]:
              latestConfig.migrations[ddbmEnv as string].concat(file),
          },
        });
        // Update
        logger.log("APPLIED", file);
      }
    }

    if (options.dryRun) {
      process.exit(0);
    }
  });

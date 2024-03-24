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

export const rollback = new Command("rollback")
  .description("Run migrations for an environment")
  .option("-e, --env <env>", "Environment to migrate")
  .option("-n, --num <num>", "Number of migrations to rollback")
  .option("-d, --dry-run", "See the plan for migrations before rolling back")
  .action(async (options) => {
    const config = await ddbmReadConfig();
    let ddbmEnv: string | undefined = options.env;

    // Number of steps to rollback
    const steps = options.num ? parseInt(options.num) : 1;

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
          message: "Which environment would you like to rollback?",
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
      logger.log(
        "INFO",
        `Dry run plan for rolling back ${ddbmEnv} environment up to ${steps} step(s)`
      );
    } else {
      logger.log(
        "INFO",
        `Rolling back ${ddbmEnv} environment up to ${steps} step(s)`
      );
    }

    const migrationFiles = await readMigrationFiles();

    if (migrationFiles.length === 0) {
      logger.log("INFO", "No migrations to rollback");
      process.exit(0);
    }

    if (migrationFiles.length < steps) {
      logger.error(
        "ERROR",
        `Cannot rollback ${steps} step(s) as there are only ${migrationFiles.length} migrations`
      );
      process.exit(1);
    }

    const migrationFilesToRollback = migrationFiles
      .filter((file) => config.migrations[ddbmEnv as string].includes(file))
      .slice(-steps)
      .reverse();

    if (migrationFilesToRollback.length === 0) {
      logger.log("INFO", "No migrations to rollback");
      process.exit(0);
    }

    const appliedMigrations: string[] = [];

    for (const file of migrationFilesToRollback) {
      if (options.dryRun) {
        logger.log("PENDING", file);
      } else {
        const migration = await import(pathFromCwd(`.ddbm/migrations/${file}`));
        await migration.down();
        appliedMigrations.push(file);
        logger.log("REVERTED", file);
      }
    }

    if (options.dryRun) {
      process.exit(0);
    }

    await ddbmUpdateConfig({
      ...config,
      migrations: {
        ...config.migrations,
        [ddbmEnv as string]: config.migrations[ddbmEnv as string].filter(
          (file: string) => !appliedMigrations.includes(file)
        ),
      },
    });
  });

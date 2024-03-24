import { Command } from "@commander-js/extra-typings";
import prompts from "prompts";
import chalk from "chalk";
import {
  dmcsUpdateConfig,
  pathFromCwd,
  readMigrationFiles,
  dmcsReadConfig,
} from "@/util/fs";
import process from "node:process";

import { logger } from "@/util/logger";
import { selectProject } from "@/util/prompts";

export const rollback = new Command("rollback")
  .description("Run migrations for an environment")
  .option("-p, --project <name>", "Project name")
  .option("-e, --env <env>", "Environment to migrate")
  .option("-n, --num <num>", "Number of migrations to rollback")
  .option("-d, --dry-run", "See the plan for migrations before rolling back")
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    ".dmcs.config.json"
  )
  .action(async (options) => {
    const config = await dmcsReadConfig(options.config);
    const project = await selectProject(options, config);
    let dmcsEnv: string | undefined = options.env;

    // Number of steps to rollback
    const steps = options.num ? parseInt(options.num) : 1;

    if (!dmcsEnv) {
      const choices = Object.keys(config[project].migrations).map((env) => ({
        title: env,
        value: env,
      }));

      // Ask for initial environment
      const result = await prompts(
        {
          type: "select",
          name: "dmcsEnv",
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
      dmcsEnv = result.dmcsEnv;

      if (!dmcsEnv) {
        console.log(chalk.red("No environment selected"));
        process.exit(1);
      }
    }

    if (!config[project].migrations[dmcsEnv]) {
      console.log(chalk.red(`No migrations found for ${dmcsEnv}`));
      process.exit(1);
    }

    if (options.dryRun) {
      logger.log(
        "INFO",
        `Dry run plan for rolling back ${dmcsEnv} environment up to ${steps} step(s)`
      );
    } else {
      logger.log(
        "INFO",
        `Rolling back ${dmcsEnv} environment up to ${steps} step(s)`
      );
    }

    const migrationFiles = await readMigrationFiles(project);

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
      .filter((file) =>
        config[project].migrations[dmcsEnv as string].includes(file)
      )
      .slice(-steps)
      .reverse();

    if (migrationFilesToRollback.length === 0) {
      logger.log("INFO", "No migrations to rollback");
      process.exit(0);
    }

    for (const file of migrationFilesToRollback) {
      if (options.dryRun) {
        logger.log("PENDING", file);
      } else {
        const migration = await import(
          pathFromCwd(`.dmcs/${project}/migrations/${file}`)
        );
        await migration.down();

        const latestConfig = await dmcsReadConfig(options.config);
        await dmcsUpdateConfig(options.config, {
          ...latestConfig,
          [project]: {
            ...latestConfig[project],
            migrations: {
              ...latestConfig[project].migrations,
              [dmcsEnv as string]: latestConfig[project].migrations[
                dmcsEnv as string
              ].filter((migration: string) => migration !== file),
            },
          },
        });
        logger.log("REVERTED", file);
      }
    }

    if (options.dryRun) {
      process.exit(0);
    }
  });

import { Command } from "@commander-js/extra-typings";
import {
  dmcsUpdateConfig,
  pathFromCwd,
  readMigrationFiles,
  dmcsReadConfig,
} from "@/util/fs";
import process from "node:process";

import { logger } from "@/util/logger";
import { selectEnv, selectProject } from "@/util/prompts";

export const migrate = new Command("migrate")
  .description("Run migrations for an environment")
  .option("-p, --project <name>", "Project name")
  .option("-e, --env <env>", "Environment to migrate")
  .option("-d, --dry-run", "See the plan for migrations before applying")
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    ".dmcs.config.json"
  )
  .action(async (options) => {
    const config = await dmcsReadConfig(options.config);
    const project = await selectProject(options, config);
    const dmcsEnv = await selectEnv(options, project, config);

    if (options.dryRun) {
      logger.log("INFO", `Dry run plan for migrating ${dmcsEnv} environment`);
    } else {
      logger.log("INFO", `Migrating ${dmcsEnv} environment`);
    }

    const migrationFiles = await readMigrationFiles(project);
    const migrationFilesToApply = migrationFiles.filter(
      (file) => !config[project].migrations[dmcsEnv as string].includes(file)
    );

    if (migrationFilesToApply.length === 0) {
      logger.log("INFO", "No migrations to apply");
      process.exit(0);
    }

    for (const file of migrationFilesToApply) {
      const migration = await import(
        pathFromCwd(`.dmcs/${project}/migrations/${file}`)
      );

      if (options.dryRun) {
        logger.log("PENDING", file);
      } else {
        await migration.up();
        const latestConfig = await dmcsReadConfig(options.config);
        await dmcsUpdateConfig(options.config, {
          ...latestConfig,
          [project]: {
            ...latestConfig[project],
            migrations: {
              ...latestConfig[project].migrations,
              [dmcsEnv as string]:
                latestConfig[project].migrations[dmcsEnv as string].concat(
                  file
                ),
            },
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

import { Command } from "@commander-js/extra-typings";
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import ora from "ora";
import process from "node:process";
import { logger } from "@/util/logger";
import { dmcsReadConfig, pathFromCwd } from "@/util/fs";
import snakeCase from "lodash.snakecase";
import { CONFIG_DEFAULT_PATH, getInitMigration } from "@/util/constants";
import { selectProject, setMigrationName } from "@/util/prompts";

export const create = new Command("create")
  .description("Create a new migration file")
  .option("-p, --project <name>", "Project name")
  .option("-n, --name <name>", "Name of the migration")
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    CONFIG_DEFAULT_PATH
  )
  .action(async (options) => {
    const config = await dmcsReadConfig(options.config);
    const project = await selectProject(options, config);
    const migrationName = await setMigrationName(options);
    const projectMigrationsFolder = `.dmcs/${project}/migrations`;
    const migrationsFolderPath = pathFromCwd(projectMigrationsFolder);

    const spinner = ora("Creating new migration file...").start();

    // Create initial migration file
    if (!existsSync(migrationsFolderPath)) {
      spinner.fail(
        "DMCS migrations folder not found. Run 'dmcs init' to initialise DMCS"
      );
      process.exit(1);
    }

    const migrationFilePath = `${projectMigrationsFolder}/${Date.now()}_${snakeCase(
      migrationName
    )}.mjs`;

    await writeFile(
      pathFromCwd(migrationFilePath),
      getInitMigration(migrationName)
    );

    spinner.succeed("Created new migration file");
    logger.log("CREATED", migrationFilePath);
  });

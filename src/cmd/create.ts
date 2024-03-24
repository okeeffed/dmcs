import { Command } from "@commander-js/extra-typings";
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import prompts from "prompts";
import ora from "ora";
import chalk from "chalk";
import process from "node:process";
import { logger } from "@/util/logger";
import { pathFromCwd } from "@/util/fs";
import snakeCase from "lodash.snakecase";
import { getInitMigration } from "@/util/constants";

export const create = new Command("create")
  .description("Create a new migration file")
  .option("-n, --name <name>", "Name of the migration")
  .action(async (options) => {
    let migrationName: string | undefined = options.name;

    if (!migrationName) {
      // Ask for initial environment
      const result = await prompts(
        {
          type: "text",
          name: "migrationName",
          message: "Name of the migration (e.g. add_updated_at_data_to_role)?",
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
    )}.mjs`;

    await writeFile(
      pathFromCwd(migrationFilePath),
      getInitMigration(migrationName)
    );

    spinner.succeed("Created new migration file");
    logger.log("CREATED", migrationFilePath);
  });

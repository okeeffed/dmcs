import { Command } from "@commander-js/extra-typings";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import ora from "ora";
import process from "node:process";
import { logger } from "@/util/logger";
import { pathFromCwd } from "@/util/fs";
import { getInitConfig, getInitMigration } from "@/util/constants";
import {
  setInitialEnvironmentName,
  setInitialProjectName,
} from "@/util/prompts";

export const init = new Command("init")
  .description(
    "Initialise the AWS DDB migrations folder and configuration file"
  )
  .option("-p, --project <name>", "Project name")
  .option("-e, --env <name>", "Name of the environment")
  .option("-f, --force", "Force initialisation")
  .action(async (options) => {
    const configFilePath = pathFromCwd(".dmcs.config.json");

    if (existsSync(configFilePath) && !options.force) {
      logger.error("ERROR", "DMCS already initialised");
      process.exit(1);
    }

    const projectName = await setInitialProjectName(options);
    const initEnv = await setInitialEnvironmentName(options);

    const spinner = ora("Initialising DMCS...").start();

    // Create initial migrations folder
    if (!existsSync(".dmcs")) {
      await mkdir(".dmcs");
    }

    if (!existsSync(`.dmcs/${projectName}`)) {
      await mkdir(`.dmcs/${projectName}`);
    }

    const migrationsFolderPath = pathFromCwd(`.dmcs/${projectName}/migrations`);

    // Create initial configuration file
    if (!existsSync(configFilePath)) {
      await writeFile(configFilePath, getInitConfig(projectName, initEnv));
    }

    // Create initial migration file
    if (!existsSync(migrationsFolderPath)) {
      await mkdir(migrationsFolderPath);
    }

    const migrationFilePath = `.dmcs/${projectName}/migrations/${Date.now()}_init.mjs`;
    await writeFile(pathFromCwd(migrationFilePath), getInitMigration("init"));

    spinner.succeed("Initialised DMCS");
    logger.log("CREATED", ".dmcs.config.js");
    logger.log("CREATED", migrationFilePath);
  });

import { Command } from "@commander-js/extra-typings";
import { dmcsUpdateConfig, dmcsReadConfig, pathFromCwd } from "@/util/fs";

import { logger } from "@/util/logger";
import {
  setInitialEnvironmentName,
  setInitialProjectName,
} from "@/util/prompts";
import { existsSync } from "node:fs";

export const projectAdd = new Command("project-add")
  .description("Add a new project to the configuration")
  .option("-p, --project <name>", "Project name")
  .option("-e, --env <name>", "Name of the environment")
  .option("-f, --force", "Force initialisation")
  .action(async (options) => {
    const config = await dmcsReadConfig();
    const project = await setInitialProjectName(options);
    const initialEnv = await setInitialEnvironmentName(options);

    if (
      existsSync(pathFromCwd(`.dmcs/${project}/migrations`)) &&
      !options.force
    ) {
      logger.error("ERROR", "DMCS already initialised");
      process.exit(1);
    }

    await dmcsUpdateConfig({
      ...config,
      [project]: {
        migrationsFolder: `.dmcs/${project}/migrations`,
        migrations: {
          [initialEnv]: [],
        },
      },
    });

    logger.log(
      "INFO",
      `Added project ${project} with initial environment ${initialEnv}`
    );
  });

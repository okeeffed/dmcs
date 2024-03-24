import { Command } from "@commander-js/extra-typings";
import { dmcsUpdateConfig, dmcsReadConfig } from "@/util/fs";

import { logger } from "@/util/logger";
import {
  setInitialEnvironmentName,
  setInitialProjectName,
} from "@/util/prompts";

export const projectAdd = new Command("project-add")
  .description("Add a new project to the configuration")
  .option("-p, --project <name>", "Project name")
  .option("-e, --env <name>", "Name of the environment")
  .action(async (options) => {
    const config = await dmcsReadConfig();
    const project = await setInitialProjectName(options);
    const initialEnv = await setInitialEnvironmentName(options);

    await dmcsUpdateConfig({
      ...config,
      [project]: {
        migrations: {
          ...config.migrations,
          [initialEnv]: [],
        },
      },
    });

    logger.log(
      "INFO",
      `Added project ${project} with initial environment ${initialEnv}`
    );
  });

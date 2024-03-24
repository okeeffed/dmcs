import { Command } from "@commander-js/extra-typings";
import { dmcsUpdateConfig, dmcsReadConfig } from "@/util/fs";

import { logger } from "@/util/logger";
import { selectProject, setNewEnvName } from "@/util/prompts";

export const envAdd = new Command("env-add")
  .description("Add a new environment to the configuration")
  .option("-p, --project <name>", "Project name")
  .option("-e, --env <name>", "Name of the environment")
  .action(async (options) => {
    const config = await dmcsReadConfig();
    const project = await selectProject(options, config);
    const env = await setNewEnvName(options, project, config);

    await dmcsUpdateConfig({
      ...config,
      [project]: {
        ...config[project],
        migrations: {
          ...config[project].migrations,
          [env]: [],
        },
      },
    });

    logger.log("INFO", `Added environment ${env}`);
  });

import { Command } from "@commander-js/extra-typings";
import { dmcsUpdateConfig, dmcsReadConfig } from "@/util/fs";

import { logger } from "@/util/logger";
import { selectProject, setNewEnvName } from "@/util/prompts";
import { CONFIG_DEFAULT_PATH } from "@/util/constants";
import { produce } from "immer";

export const envAdd = new Command("env-add")
  .description("Add a new environment to the configuration")
  .option("-p, --project <name>", "Project name")
  .option("-e, --env <name>", "Name of the environment")
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    CONFIG_DEFAULT_PATH
  )
  .action(async (options) => {
    const config = await dmcsReadConfig(options.config);
    const project = await selectProject(options, config);
    const env = await setNewEnvName(options, project, config);

    const updatedConfig = produce(config, (draft: typeof config) => {
      draft[project].migrations[env] = [];
    });
    await dmcsUpdateConfig(options.config, updatedConfig);

    logger.log("INFO", `Added environment ${env}`);
  });

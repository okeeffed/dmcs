import { Command } from "@commander-js/extra-typings";
import { dmcsReadConfig } from "@/util/fs";
import { logger } from "@/util/logger";
import { CONFIG_DEFAULT_PATH } from "@/util/constants";

export const projectList = new Command("project-list")
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    CONFIG_DEFAULT_PATH
  )
  .description("List all projects in the configuration")
  .action(async (options) => {
    const config = await dmcsReadConfig(options.config);
    const existingProjects = Object.keys(config);

    if (existingProjects.length === 0) {
      logger.warn("WARN", "No project found");
    } else {
      logger.log("INFO", "Projects:");
      existingProjects.forEach((env) => {
        console.log(env);
      });
    }
  });

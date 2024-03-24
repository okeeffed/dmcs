import { Command } from "@commander-js/extra-typings";
import { dmcsReadConfig } from "@/util/fs";
import { logger } from "@/util/logger";

export const projectList = new Command("project-list")
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    ".dmcs.config.json"
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

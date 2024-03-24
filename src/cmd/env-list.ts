import { Command } from "@commander-js/extra-typings";
import { dmcsReadConfig } from "@/util/fs";
import { logger } from "@/util/logger";
import { selectProject } from "@/util/prompts";

export const envList = new Command("env-list")
  .description("List all environments in the configuration")
  .option("-p, --project <name>", "Project name")
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    ".dmcs.config.json"
  )
  .action(async (options) => {
    const config = await dmcsReadConfig(options.config);
    const project = await selectProject(options, config);
    const existingEnvs = Object.keys(config[project].migrations);

    if (existingEnvs.length === 0) {
      logger.warn("WARN", "No environments found");
    } else {
      logger.log("INFO", "Environments:");
      existingEnvs.forEach((env) => {
        console.log(env);
      });
    }
  });

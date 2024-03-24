import { Command } from "@commander-js/extra-typings";
import { ddbmReadConfig } from "@/util/fs";
import { logger } from "@/util/logger";

export const envList = new Command("env-list")
  .description("List all environments in the configuration")
  .action(async () => {
    const config = await ddbmReadConfig();
    const existingEnvs = Object.keys(config.migrations);

    if (existingEnvs.length === 0) {
      logger.warn("WARN", "No environments found");
    } else {
      logger.log("INFO", "Environments:");
      existingEnvs.forEach((env) => {
        console.log(env);
      });
    }
  });

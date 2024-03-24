import prompts from "prompts";
import { logger } from "@/util/logger";

const onCancel = () => {
  logger.warn("INFO", "User cancelled");
  process.exit(0);
};

export async function setInitialProjectName<T extends Record<string, any>>(
  options: T
) {
  let projectName: string | undefined = options.project;

  // Ask for project name
  if (!projectName) {
    const { project } = await prompts(
      {
        type: "text",
        name: "project",
        message: "Enter the initial project name",
      },
      {
        onCancel,
      }
    );

    projectName = project;
  }

  if (!projectName || projectName.trim() === "") {
    logger.error("ERROR", "No project name provided");
    process.exit(1);
  }

  return projectName;
}

export async function selectProject<T extends Record<string, any>>(
  options: T,
  config: any
) {
  let projectName: string | undefined = options.project;

  if (!projectName) {
    const choices = Object.keys(config).map((project) => ({
      title: project,
      value: project,
    }));

    const result = await prompts(
      {
        type: "select",
        name: "projectName",
        message: "Which project would you like to use?",
        choices,
      },
      {
        onCancel,
      }
    );

    projectName = result.projectName;
  }

  if (!projectName) {
    logger.error("ERROR", "No project selected");
    process.exit(1);
  }

  return projectName;
}

export async function setMigrationName<T extends Record<string, any>>(
  options: T
) {
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
        onCancel,
      }
    );
    migrationName = result.migrationName;
  }

  if (!migrationName || migrationName.length < 1) {
    logger.error("ERROR", "Invalid migration name provided");
    process.exit(1);
  }

  return migrationName;
}

export async function setNewEnvName<T extends Record<string, any>>(
  options: T,
  project: string,
  config: any
) {
  const existingEnvs = Object.keys(config[project].migrations);
  let env: string | undefined = options.env;

  if (!env) {
    // Ask for initial environment
    const result = await prompts(
      {
        type: "text",
        name: "env",
        message: "What is the name of the new environment?",
      },
      {
        onCancel,
      }
    );
    env = result.env;
  }

  if (!env || env.trim() === "") {
    logger.error("ERROR", "Invalid environment name provided");
    process.exit(1);
  }

  if (existingEnvs.includes(env)) {
    logger.error("ERROR", "Environment already exists");
    process.exit(1);
  }

  return env;
}

export async function setInitialEnvironmentName<T extends Record<string, any>>(
  options: T
) {
  let initEnv = options.env;

  if (!initEnv) {
    // Ask for initial environment
    const result = await prompts(
      {
        type: "text",
        name: "initEnv",
        message: "Enter the initial environment name",
        initial: "development",
      },
      {
        onCancel,
      }
    );

    initEnv = result.initEnv;
  }

  if (!initEnv || initEnv.trim() === "") {
    logger.error("ERROR", "Invalid environment name provided");
    process.exit(1);
  }

  return initEnv;
}

export async function selectEnv<T extends Record<string, any>>(
  options: T,
  project: string,
  config: any
) {
  let dmcsEnv: string | undefined = options.env;

  if (!dmcsEnv) {
    const choices = Object.keys(config[project].migrations).map((env) => ({
      title: env,
      value: env,
    }));

    // Ask for initial environment
    const result = await prompts(
      {
        type: "select",
        name: "dmcsEnv",
        message: "Which environment would you like to migrate?",
        choices,
      },
      {
        onCancel,
      }
    );
    dmcsEnv = result.dmcsEnv;

    if (!dmcsEnv) {
      logger.error("ERROR", "No environment selected");
      process.exit(1);
    }
  }

  if (!config[project].migrations[dmcsEnv]) {
    logger.error("ERROR", `No migrations found for ${dmcsEnv}`);
    process.exit(1);
  }

  return dmcsEnv;
}

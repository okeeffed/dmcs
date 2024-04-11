import { Command } from "@commander-js/extra-typings";
import {
  dmcsUpdateConfig,
  pathFromCwd,
  readMigrationFiles,
  dmcsReadConfig,
  findTsConfigFile,
  requireModule,
} from "@/util/fs";
import process from "node:process";
import vm from "node:vm";
import esbuild from "esbuild";
import { exec } from "node:child_process";

import { logger } from "@/util/logger";
import { selectEnv, selectProject } from "@/util/prompts";
import { CONFIG_DEFAULT_PATH } from "@/util/constants";
import path from "node:path";
import { produce } from "immer";
import { Sandbox } from "@/util/types";

async function runTsFile({
  project,
  file,
  options,
  dmcsEnv,
}: {
  project: string;
  file: string;
  options: any;
  dmcsEnv: string;
}) {
  let tsConfigFilePath = options.tsconfig;

  if (!tsConfigFilePath) {
    tsConfigFilePath = await findTsConfigFile();
  }
  const filePath = pathFromCwd(`.dmcs/${project}/migrations/${file}`);

  // Compile TypeScript to JavaScript using ESBuild
  // Perform the build and keep the output in-memory
  const result = await esbuild.build({
    entryPoints: [filePath],
    bundle: true,
    platform: "node",
    format: "cjs",
    tsconfig: tsConfigFilePath, // Adjust as needed
    write: false, // Keep output in-memory
  });

  // Access the compiled code directly from the result object
  // Assuming only one output file, which is typical for single entry point scenarios
  const code = result.outputFiles[0].text;

  // Define what we want to include in our sandboxed environment
  const sandbox: Sandbox = {
    exec,
    console: console, // Make console available in the sandbox
    require: requireModule, // Provide a custom require function
    process: process, // Optionally make the process object available
    module: { exports: {} }, // Mock module object if needed
    __dirname: path.dirname(filePath), // Provide __dirname
    __filename: filePath, // Provide __filename
  };

  const context = vm.createContext(sandbox);

  const script = new vm.Script(code, {
    filename: path.basename(filePath),
  });

  // Execute the script in the sandbox
  script.runInContext(context);

  // Now, you can call the 'up' function from the compiled code
  if (typeof sandbox.module.exports.up === "function") {
    await sandbox.module.exports.up();
    const latestConfig = await dmcsReadConfig(options.config);
    const updatedConfig = produce(
      latestConfig,
      (draft: typeof latestConfig) => {
        draft[project].migrations[dmcsEnv as string].push(file);
      }
    );
    await dmcsUpdateConfig(options.config, updatedConfig);
    logger.log("APPLIED", file);
  } else {
    throw new Error("Migration file does not have an 'up' function");
  }
}

async function runJsFile({
  project,
  file,
  options,
  dmcsEnv,
}: {
  project: string;
  file: string;
  options: any;
  dmcsEnv: string;
}) {
  // Run JavaScript file
  const migration = await import(
    pathFromCwd(`.dmcs/${project}/migrations/${file}`)
  );

  if (typeof migration.up === "function") {
    await migration.up();
    const latestConfig = await dmcsReadConfig(options.config);

    const updatedConfig = produce(
      latestConfig,
      (draft: typeof latestConfig) => {
        draft[project].migrations[dmcsEnv as string].push(file);
      }
    );
    await dmcsUpdateConfig(options.config, updatedConfig);
    logger.log("APPLIED", file);
  } else {
    throw new Error("Migration file does not have an 'up' function");
  }
}

export const migrate = new Command("migrate")
  .description("Run migrations for an environment")
  .option("-p, --project <name>", "Project name")
  .option("-e, --env <env>", "Environment to migrate")
  .option("-d, --dry-run", "See the plan for migrations before applying")
  .option(
    "-c, --config <path>",
    "Path to the configuration file",
    CONFIG_DEFAULT_PATH
  )
  .option(
    "-t, --tsconfig <path>",
    "Path to the tsconfig.json file used for compiling TypeScript migration files"
  )
  .action(async (options) => {
    const config = await dmcsReadConfig(options.config);
    const project = await selectProject(options, config);
    const dmcsEnv = await selectEnv(options, project, config);

    if (options.dryRun) {
      logger.log("INFO", `Dry run plan for migrating ${dmcsEnv} environment`);
    } else {
      logger.log("INFO", `Migrating ${dmcsEnv} environment`);
    }

    const migrationFiles = await readMigrationFiles(project);
    const migrationFilesToApply = migrationFiles.filter(
      (file) => !config[project].migrations[dmcsEnv as string].includes(file)
    );

    if (migrationFilesToApply.length === 0) {
      logger.log("INFO", "No migrations to apply");
      process.exit(0);
    }

    for (const file of migrationFilesToApply) {
      if (options.dryRun) {
        logger.log("PENDING", file);
      } else {
        if (file.endsWith(".ts")) {
          await runTsFile({ project, file, options, dmcsEnv });
        } else if (file.endsWith(".mjs")) {
          await runJsFile({ project, file, options, dmcsEnv });
        }
      }
    }

    if (options.dryRun) {
      process.exit(0);
    }
  });

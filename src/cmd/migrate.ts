import { Command } from "@commander-js/extra-typings";
import {
  dmcsUpdateConfig,
  readMigrationFiles,
  dmcsReadConfig,
  findTsConfigFile,
} from "@/util/fs";
import process from "node:process";
import esbuild from "esbuild";
import { logger } from "@/util/logger";
import { selectEnv, selectProject } from "@/util/prompts";
import { CONFIG_DEFAULT_PATH } from "@/util/constants";
import path from "node:path";
import { produce } from "immer";
import { nodeExternalsPlugin } from "@/plugins";
import fs from "node:fs/promises";

// Helper function to check if a file exists
async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

// Helper function to resolve TypeScript paths
async function resolveTypescriptPath(
  importPath: string,
  importer: string
): Promise<string | null> {
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
  const resolvedBase = path.resolve(path.dirname(importer), importPath);

  // First try the exact path
  if (await fileExists(resolvedBase)) {
    return resolvedBase;
  }

  // Then try with each extension
  for (const ext of extensions) {
    const pathWithExt = `${resolvedBase}${ext}`;
    if (await fileExists(pathWithExt)) {
      return pathWithExt;
    }
  }

  // Try index files if the path is a directory
  for (const ext of extensions) {
    const indexPath = path.join(resolvedBase, `index${ext}`);
    if (await fileExists(indexPath)) {
      return indexPath;
    }
  }

  return null;
}

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

  const rootDir = path.resolve(process.cwd());
  // Construct the correct file path
  const filePath = path.join(rootDir, ".dmcs", project, "migrations", file);

  logger.log("DEBUG", `Looking for migration file at: ${filePath}`);

  // Verify file exists
  try {
    await fs.access(filePath);
  } catch (err) {
    throw new Error(`Migration file not found at ${filePath}`);
  }

  // Compile TypeScript to JavaScript using ESBuild with ESM output
  const result = await esbuild.build({
    entryPoints: [filePath],
    bundle: true,
    platform: "node",
    format: "esm",
    tsconfig: tsConfigFilePath,
    write: false,
    external: ["*"],
    plugins: [
      nodeExternalsPlugin,
      {
        name: "resolve-ts-paths",
        setup(build) {
          // Handle relative imports from the project root and any TypeScript imports
          build.onResolve(
            { filter: /^\.\.\/|^\.\/|^[^\.\/]/ },
            async (args) => {
              logger.log(
                "DEBUG",
                `Resolving import: ${args.path} from ${args.importer}`
              );

              // Handle relative imports from project root (../../)
              if (args.path.startsWith("../../")) {
                const resolvedPath = await resolveTypescriptPath(
                  args.path.slice(6), // Remove ../../
                  path.join(rootDir, project)
                );
                if (resolvedPath) {
                  logger.log(
                    "DEBUG",
                    `Resolved root import to: ${resolvedPath}`
                  );
                  return { path: resolvedPath };
                }
              }

              // Handle normal relative imports (./ or ../)
              if (args.path.startsWith(".")) {
                const resolvedPath = await resolveTypescriptPath(
                  args.path,
                  args.importer
                );
                if (resolvedPath) {
                  logger.log(
                    "DEBUG",
                    `Resolved relative import to: ${resolvedPath}`
                  );
                  return { path: resolvedPath };
                }
              }

              // Handle package imports or absolute paths
              return { external: true };
            }
          );
        },
      },
    ],
    absWorkingDir: path.join(rootDir), // Set working directory to the project root
    banner: {
      js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
    },
  });

  const code = result.outputFiles[0].text;

  // Create a temporary file to store the compiled code
  const tempDir = path.join(rootDir, ".dmcs", project, "migrations", "temp");
  const tempFile = path.join(tempDir, `temp_${Date.now()}.mjs`);

  try {
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Write the compiled code to the temporary file
    await fs.writeFile(tempFile, code, "utf8");

    // Import the compiled module
    const fileUrl = new URL(`file://${tempFile}`).href;
    const migration = await import(fileUrl);

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
  } catch (error) {
    if (error instanceof Error) {
      logger.log("ERROR", `Failed to run migration: ${error.message}`);
      if (error.stack) {
        logger.log("DEBUG", error.stack);
      }
      throw error;
    }
  } finally {
    // Clean up the temporary file and directory
    try {
      await fs.unlink(tempFile);
      await fs.rmdir(tempDir);
    } catch (err) {
      logger.log("WARN", `Failed to clean up temporary file: ${tempFile}`);
    }
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
  const rootDir = path.resolve(process.cwd());
  const migrationPath = path.join(
    rootDir,
    ".dmcs",
    project,
    "migrations",
    file
  );
  const fileUrl = new URL(`file://${migrationPath}`).href;
  const migration = await import(fileUrl);

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

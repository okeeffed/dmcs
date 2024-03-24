#!/usr/bin/env node

import prompts, { Choice } from "prompts";
import rrd from "recursive-readdir";
import Fuse from "fuse.js";
import path from "path";
import { findUp } from "find-up";
import { Project } from "ts-morph";
import yargs from "yargs-parser";
import chalk from "chalk";

const CODEMOD_FNS = ["example", "parseRouteInformation"];

const onCancel = () => {
  console.log("Operation canceled.");
  process.exit(0);
};

const suggest = async (input: string, choices: Choice[]) => {
  const data = choices.map((choice) => choice.title);

  // Initialize Fuse.js with data and fuzzy matching options
  const fuse = new Fuse(data, {
    includeScore: true,
    threshold: 0.5, // Adjust the fuzzy matching threshold as needed
  });

  if (!input) {
    return choices;
  }

  const results = fuse.search(input);
  return results.map((result) => choices[result.refIndex]);
};

function ignoreFunc(file: string) {
  // Ignore files that are not .ts or .tsx
  if (!file.endsWith(".ts") && !file.endsWith(".tsx")) {
    return true;
  }
  // Ignore test files
  if (
    file.includes(".test.") ||
    file.includes(".spec.") ||
    file.endsWith(".snap")
  ) {
    return true;
  }

  if (path.basename(file) === "index.ts") {
    return true;
  }

  // Return false to include this file
  return false;
}

async function main() {
  try {
    const args = yargs(process.argv.slice(2));
    const configPath = await findUp(".ddbm.config.mjs");

    if (!configPath) {
      console.error("No config file found. Exiting...");
      process.exit(1);
    }

    if (args["dry-run"]) {
      console.log(chalk.yellow("Dry run enabled. Skipping file write."));
    }

    const { default: config } = await import(configPath);
    const { fn } = await prompts(
      {
        type: "autocomplete",
        name: "fn",
        message: "Enter the AWS profile name",
        suggest,
        choices: CODEMOD_FNS.map((name) => ({
          title: name,
          value: name,
        })),
      },
      {
        onCancel,
      }
    );

    const filesToModify = await rrd(config.entry, [ignoreFunc]);

    for (const file of filesToModify) {
      const project = new Project();
      project.addSourceFileAtPath(file);

      const result = await modFn(file, project);

      if (args["dry-run"]) {
        console.log(chalk.bgGreen(file));
        console.log(result + "\n");
      } else {
        project.saveSync();
        console.log(chalk.green("Modified:"), file);
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

main();

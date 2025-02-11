#!/usr/bin/env node

import { program } from "@commander-js/extra-typings";
import { init } from "@/cmd/init";
import { migrate } from "@/cmd/migrate";
import { rollback } from "@/cmd/rollback";
import { create } from "@/cmd/create";
import { envList } from "@/cmd/env-list";
import { envAdd } from "@/cmd/env-add";
import packageJson from "../package.json";
import { projectList } from "./cmd/project-list";
import { projectAdd } from "./cmd/project-add";

async function main() {
  program.version(packageJson.version).description(packageJson.description);

  program.addCommand(init);
  program.addCommand(migrate);
  program.addCommand(rollback);
  program.addCommand(create);
  program.addCommand(envList);
  program.addCommand(envAdd);
  program.addCommand(projectList);
  program.addCommand(projectAdd);

  program.parse(process.argv);
}

main();

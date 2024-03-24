import { program } from "@commander-js/extra-typings";
import { init } from "@/cmd/init";
import { migrate } from "@/cmd/migrate";
import { rollback } from "@/cmd/rollback";
import { create } from "@/cmd/create";
import { envList } from "@/cmd/env-list";
import { envAdd } from "@/cmd/env-add";

async function main() {
  program
    .version("0.0.4")
    .description("A simple CLI tool to manage DynamoDB data migrations");

  program.addCommand(init);
  program.addCommand(migrate);
  program.addCommand(rollback);
  program.addCommand(create);
  program.addCommand(envList);
  program.addCommand(envAdd);

  program.parse(process.argv);
}

main();

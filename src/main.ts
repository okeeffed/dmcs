import { program } from "@commander-js/extra-typings";
import { init } from "@/cmd/init";
import { migrate } from "@/cmd/migrate";
import { rollback } from "@/cmd/rollback";
import { create } from "@/cmd/create";
import packageJson from "../package.json";

async function main() {
  program.version(packageJson.version).description(packageJson.description);

  program.addCommand(init);
  program.addCommand(migrate);
  program.addCommand(rollback);
  program.addCommand(create);

  program.parse(process.argv);
}

main();

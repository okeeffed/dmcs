import { program } from "@commander-js/extra-typings";
import { init } from "./cmd/init";
import { migrate } from "./cmd/migrate";
import { rollback } from "./cmd/rollback";

program.version("1.0.0").description("An example CLI");

program.addCommand(init);
program.addCommand(migrate);
program.addCommand(rollback);

program.parse(process.argv);

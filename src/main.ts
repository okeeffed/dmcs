import { program } from "@commander-js/extra-typings";
import { init } from "./cmd/init";
import { migrate } from "./cmd/migrate";

program.version("1.0.0").description("An example CLI");

program.addCommand(init);
program.addCommand(migrate);

program.parse(process.argv);

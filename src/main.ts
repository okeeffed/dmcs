import { program } from "@commander-js/extra-typings";
import { init } from "./cmd/init";

program.version("1.0.0").description("An example CLI");

program.addCommand(init);

program.parse(process.argv);

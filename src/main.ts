import {
  copyTemplateFiles,
  createProjectDirectory,
  installPackages,
  createFirstGitCommit,
  prettierFormat,
  setConfigNetworkToSepolia,
} from "./tasks";
import type { Options } from "./types";
import { renderOutroMessage } from "./utils/render-outro-message";
import chalk from "chalk";
import { Listr, ListrContext } from "listr2";
import path from "path";
import { fileURLToPath } from "url";

type CreateStylusListrContext = Options & ListrContext;

export async function createProject(options: Options) {
  console.log(`\n`);

  const currentFileUrl = import.meta.url;

  const templateDirectory = path.resolve(
    decodeURI(fileURLToPath(currentFileUrl)),
    "../../templates",
  );

  const targetDirectory = path.resolve(process.cwd(), options.directory);

  const tasks = new Listr<CreateStylusListrContext>(
    [
      {
        title: `📁 Create project directory ${targetDirectory}`,
        task: async () => await createProjectDirectory(options.directory),
      },
      {
        title: `🚀 Creating a new Scaffold-Stylus 2 app in ${chalk.green.bold(
          options.directory,
        )}`,
        task: async (ctx, task) => {
          if (ctx.options.extension) {
            task.title = `🚀 Creating a new Scaffold-Stylus 2 app${
              ctx.options.extension
                ? ` with ${chalk.green.bold(ctx.options.extension)} extension`
                : ""
            } in ${chalk.green.bold(ctx.options.directory)}`;
          }

          await copyTemplateFiles(options, templateDirectory, targetDirectory);
        },
      },
      {
        title: `⚙️ Configuring scaffold for ${chalk.green.bold(options.extension || "default")} extension`,
        task: async (ctx, task) => {
          if (ctx.options.extension && (ctx.options.extension === "chainlink-vrf" || ctx.options.extension === "chainlink-data-feed")) {
            await setConfigNetworkToSepolia(targetDirectory);
          } else {
            task.skip("No chainlink extension specified");
          }
        },
      },
      {
        title: `📦 Installing dependencies with yarn, this could take a while`,
        task: async (ctx, task) => {
          if (!!ctx.options.install) {
            await installPackages(targetDirectory, options);
          } else {
            task.skip("Manually skipped");
          }
        },
      },
      {
        title: "🪄 Formatting Next.js files with prettier",
        task: async (ctx, task) => {
          if (!!ctx.options.install) {
            await prettierFormat(targetDirectory);
          } else {
            task.skip("Skipping because prettier install was skipped");
          }
        },
      },
      {
        title: `📡 Initializing Git repository`,
        task: async () => await createFirstGitCommit(targetDirectory),
      },
    ],
    { ctx: { options } as CreateStylusListrContext },
  );

  try {
    await tasks.run();
    renderOutroMessage(options);
  } catch (error) {
    console.log("%s Error occurred", chalk.red.bold("ERROR"), error);
    console.log("%s Exiting...", chalk.red.bold("Uh oh! 😕 Sorry about that!"));
  }
}

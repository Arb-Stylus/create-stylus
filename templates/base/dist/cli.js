    import { execa } from 'execa';
import url, { fileURLToPath } from 'url';
import path from 'path';
import fs, { lstatSync, readdirSync, existsSync, promises } from 'fs';
import mergeJsonStr from 'merge-packages';
import ncp from 'ncp';
import { promisify } from 'util';
import { projectInstall } from 'pkg-install';
import chalk from 'chalk';
import Listr from 'listr';
import arg from 'arg';
import inquirer from 'inquirer';

const isExtension = (item) => item !== null;
/**
 * This function makes sure that the `T` generic type is narrowed down to
 * whatever `extensions` are passed in the question prop. That way we can type
 * check the `default` prop is not using any valid extension, but only one
 * already provided in the `extensions` prop.
 *
 * Questions can be created without this function, just using a normal object,
 * but `default` type will be any valid Extension.
 */
const typedQuestion = (question) => question;
const isDefined = (item) => item !== undefined && item !== null;
const extensionWithSubextensions = (extension) => {
    return Object.prototype.hasOwnProperty.call(extension, "extensions");
};

const baseDir = "base";

const extensionDict = {};
const currentFileUrl = import.meta.url;
const templatesDirectory = path.resolve(decodeURI(fileURLToPath(currentFileUrl)), "../../templates");
/**
 * This function has side effects. It generates the extensionDict.
 *
 * @param basePath the path at which to start the traverse
 * @returns the extensions found in this path. Useful for the recursion
 */
const traverseExtensions = async (basePath) => {
    const extensionsPath = path.resolve(basePath, "extensions");
    let extensions;
    try {
        extensions = fs.readdirSync(extensionsPath);
    }
    catch (error) {
        return [];
    }
    await Promise.all(extensions.map(async (ext) => {
        const extPath = path.resolve(extensionsPath, ext);
        const configPath = path.resolve(extPath, "config.json");
        let config = {};
        try {
            config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        }
        catch (error) {
            if (fs.existsSync(configPath)) {
                throw new Error(`Couldn't parse existing config.json file.
  Extension: ${ext};
  Config file path: ${configPath}`);
            }
        }
        let name = config.name ?? ext;
        let value = ext;
        const subExtensions = await traverseExtensions(extPath);
        const hasSubExtensions = subExtensions.length !== 0;
        const extDescriptor = {
            name,
            value,
            path: extPath,
            extensions: subExtensions,
            extends: config.extends,
        };
        if (!hasSubExtensions) {
            delete extDescriptor.extensions;
        }
        extensionDict[ext] = extDescriptor;
        return subExtensions;
    }));
    return extensions;
};
await traverseExtensions(templatesDirectory);

const findFilesRecursiveSync = (baseDir, criteriaFn = () => true) => {
    const subPaths = fs.readdirSync(baseDir);
    const files = subPaths.map((relativePath) => {
        const fullPath = path.resolve(baseDir, relativePath);
        return fs.lstatSync(fullPath).isDirectory()
            ? [...findFilesRecursiveSync(fullPath, criteriaFn)]
            : criteriaFn(fullPath)
                ? [fullPath]
                : [];
    });
    return files.flat();
};

// @ts-expect-error We don't have types for this probably add .d.ts file
function mergePackageJson(targetPackageJsonPath, secondPackageJsonPath, isDev) {
    const existsTarget = fs.existsSync(targetPackageJsonPath);
    const existsSecond = fs.existsSync(secondPackageJsonPath);
    if (!existsTarget && !existsSecond) {
        return;
    }
    const targetPackageJson = existsTarget ? fs.readFileSync(targetPackageJsonPath, "utf8") : '{}';
    const secondPackageJson = existsSecond ? fs.readFileSync(secondPackageJsonPath, "utf8") : '{}';
    const mergedPkgStr = mergeJsonStr.default(targetPackageJson, secondPackageJson);
    fs.writeFileSync(targetPackageJsonPath, mergedPkgStr, "utf8");
    if (isDev) {
        const devStr = `TODO: write relevant information for the contributor`;
        fs.writeFileSync(`${targetPackageJsonPath}.dev`, devStr, "utf8");
    }
}

const { mkdir, link } = promises;
/**
 * The goal is that this function has the same API as ncp, so they can be used
 * interchangeably.
 *
 * - clobber not implemented
 */
const linkRecursive = async (source, destination, options) => {
    const passesFilter = options?.filter === undefined
        ? true // no filter
        : typeof options.filter === 'function'
            ? options.filter(source) // filter is function
            : options.filter.test(source); // filter is regex
    if (!passesFilter) {
        return;
    }
    if (lstatSync(source).isDirectory()) {
        const subPaths = readdirSync(source);
        await Promise.all(subPaths.map(async (subPath) => {
            const sourceSubpath = path.join(source, subPath);
            const isSubPathAFolder = lstatSync(sourceSubpath).isDirectory();
            const destSubPath = path.join(destination, subPath);
            const existsDestSubPath = existsSync(destSubPath);
            if (isSubPathAFolder && !existsDestSubPath) {
                await mkdir(destSubPath);
            }
            await linkRecursive(sourceSubpath, destSubPath, options);
        }));
        return;
    }
    return link(source, destination);
};

const copy = promisify(ncp);
let copyOrLink = copy;
const expandExtensions = (options) => {
    const expandedExtensions = options.extensions
        .map((extension) => extensionDict[extension])
        .map((extDescriptor) => [extDescriptor.extends, extDescriptor.value].filter(isDefined))
        .flat()
        // this reduce just removes duplications
        .reduce((exts, ext) => (exts.includes(ext) ? exts : [...exts, ext]), []);
    return expandedExtensions;
};
const isTemplateRegex = /([^\/\\]*?)\.template\./;
const isPackageJsonRegex = /package\.json/;
const isYarnLockRegex = /yarn\.lock/;
const isNextGeneratedRegex = /packages\/nextjs\/generated/;
const isConfigRegex = /([^\/\\]*?)\\config\.json/;
const isArgsRegex = /([^\/\\]*?)\.args\./;
const isExtensionFolderRegex = /extensions$/;
const isPackagesFolderRegex = /packages$/;
const copyBaseFiles = async ({ dev: isDev }, basePath, targetDir) => {
    await copyOrLink(basePath, targetDir, {
        clobber: false,
        filter: (fileName) => {
            const isTemplate = isTemplateRegex.test(fileName);
            const isPackageJson = isPackageJsonRegex.test(fileName);
            const isYarnLock = isYarnLockRegex.test(fileName);
            const isNextGenerated = isNextGeneratedRegex.test(fileName);
            const skipAlways = isTemplate || isPackageJson;
            const skipDevOnly = isYarnLock || isNextGenerated;
            const shouldSkip = skipAlways || (isDev && skipDevOnly);
            return !shouldSkip;
        },
    });
    const basePackageJsonPaths = findFilesRecursiveSync(basePath, path => isPackageJsonRegex.test(path));
    basePackageJsonPaths.forEach(packageJsonPath => {
        const partialPath = packageJsonPath.split(basePath)[1];
        mergePackageJson(path.join(targetDir, partialPath), path.join(basePath, partialPath), isDev);
    });
    if (isDev) {
        const baseYarnLockPaths = findFilesRecursiveSync(basePath, path => isYarnLockRegex.test(path));
        baseYarnLockPaths.forEach(yarnLockPath => {
            const partialPath = yarnLockPath.split(basePath)[1];
            copy(path.join(basePath, partialPath), path.join(targetDir, partialPath));
        });
        const nextGeneratedPaths = findFilesRecursiveSync(basePath, path => isNextGeneratedRegex.test(path));
        nextGeneratedPaths.forEach(nextGeneratedPath => {
            const partialPath = nextGeneratedPath.split(basePath)[1];
            copy(path.join(basePath, partialPath), path.join(targetDir, partialPath));
        });
    }
};
const copyExtensionsFiles = async ({ extensions, dev: isDev }, targetDir) => {
    await Promise.all(extensions.map(async (extension) => {
        const extensionPath = extensionDict[extension].path;
        // copy (or link if dev) root files
        await copyOrLink(extensionPath, path.join(targetDir), {
            clobber: false,
            filter: (path) => {
                const isConfig = isConfigRegex.test(path);
                const isArgs = isArgsRegex.test(path);
                const isExtensionFolder = isExtensionFolderRegex.test(path) && fs.lstatSync(path).isDirectory();
                const isPackagesFolder = isPackagesFolderRegex.test(path) && fs.lstatSync(path).isDirectory();
                const isTemplate = isTemplateRegex.test(path);
                // PR NOTE: this wasn't needed before because ncp had the clobber: false
                const isPackageJson = isPackageJsonRegex.test(path);
                const shouldSkip = isConfig ||
                    isArgs ||
                    isTemplate ||
                    isPackageJson ||
                    isExtensionFolder ||
                    isPackagesFolder;
                return !shouldSkip;
            },
        });
        // merge root package.json
        mergePackageJson(path.join(targetDir, "package.json"), path.join(extensionPath, "package.json"), isDev);
        const extensionPackagesPath = path.join(extensionPath, "packages");
        const hasPackages = fs.existsSync(extensionPackagesPath);
        if (hasPackages) {
            // copy extension packages files
            await copyOrLink(extensionPackagesPath, path.join(targetDir, "packages"), {
                clobber: false,
                filter: (path) => {
                    const isArgs = isArgsRegex.test(path);
                    const isTemplate = isTemplateRegex.test(path);
                    const isPackageJson = isPackageJsonRegex.test(path);
                    const shouldSkip = isArgs || isTemplate || isPackageJson;
                    return !shouldSkip;
                },
            });
            // copy each package's package.json
            const extensionPackages = fs.readdirSync(extensionPackagesPath);
            extensionPackages.forEach((packageName) => {
                mergePackageJson(path.join(targetDir, "packages", packageName, "package.json"), path.join(extensionPath, "packages", packageName, "package.json"), isDev);
            });
        }
    }));
};
const processTemplatedFiles = async ({ extensions, dev: isDev }, basePath, targetDir) => {
    const baseTemplatedFileDescriptors = findFilesRecursiveSync(basePath, (path) => isTemplateRegex.test(path)).map((baseTemplatePath) => ({
        path: baseTemplatePath,
        fileUrl: url.pathToFileURL(baseTemplatePath).href,
        relativePath: baseTemplatePath.split(basePath)[1],
        source: "base",
    }));
    const extensionsTemplatedFileDescriptors = extensions
        .map((ext) => findFilesRecursiveSync(extensionDict[ext].path, (filePath) => isTemplateRegex.test(filePath)).map((extensionTemplatePath) => ({
        path: extensionTemplatePath,
        fileUrl: url.pathToFileURL(extensionTemplatePath).href,
        relativePath: extensionTemplatePath.split(extensionDict[ext].path)[1],
        source: `extension ${extensionDict[ext].name}`,
    })))
        .flat();
    await Promise.all([
        ...baseTemplatedFileDescriptors,
        ...extensionsTemplatedFileDescriptors,
    ].map(async (templateFileDescriptor) => {
        const templateTargetName = templateFileDescriptor.path.match(isTemplateRegex)?.[1];
        const argsPath = templateFileDescriptor.relativePath.replace(isTemplateRegex, `${templateTargetName}.args.`);
        const argsFileUrls = extensions
            .map((extension) => {
            const argsFilePath = path.join(extensionDict[extension].path, argsPath);
            const fileExists = fs.existsSync(argsFilePath);
            if (!fileExists) {
                return [];
            }
            return url.pathToFileURL(argsFilePath).href;
        })
            .flat();
        const args = await Promise.all(argsFileUrls.map(async (argsFileUrl) => await import(argsFileUrl)));
        const template = (await import(templateFileDescriptor.fileUrl)).default;
        if (!template) {
            throw new Error(`Template ${templateTargetName} from ${templateFileDescriptor.source} doesn't have a default export`);
        }
        if (typeof template !== "function") {
            throw new Error(`Template ${templateTargetName} from ${templateFileDescriptor.source} is not exporting a function by default`);
        }
        const freshArgs = Object.fromEntries(Object.keys(args[0] ?? {}).map((key) => [
            key,
            [], // INFO: initial value for the freshArgs object
        ]));
        const combinedArgs = args.reduce((accumulated, arg) => {
            Object.entries(arg).map(([key, value]) => {
                accumulated[key].push(value);
            });
            return accumulated;
        }, freshArgs);
        // TODO test: if first arg file found only uses 1 name, I think the rest are not used?
        const output = template(combinedArgs);
        const targetPath = path.join(targetDir, templateFileDescriptor.relativePath.split(templateTargetName)[0], templateTargetName);
        fs.writeFileSync(targetPath, output);
        if (isDev) {
            const hasCombinedArgs = Object.keys(combinedArgs).length > 0;
            const hasArgsPaths = argsFileUrls.length > 0;
            const devOutput = `--- TEMPLATE FILE
templates/${templateFileDescriptor.source}${templateFileDescriptor.relativePath}


--- ARGS FILES
${hasArgsPaths
                ? argsFileUrls.map(url => `\t- ${path.join('templates', url.split('templates')[1])}`).join('\n')
                : '(no args files writing to the template)'}


--- RESULTING ARGS
${hasCombinedArgs
                ? Object.entries(combinedArgs)
                    .map(([argName, argValue]) => `\t- ${argName}:\t[${argValue.join(',')}]`)
                    // TODO improvement: figure out how to add the values added by each args file
                    .join('\n')
                : '(no args sent for the template)'}
`;
            fs.writeFileSync(`${targetPath}.dev`, devOutput);
        }
    }));
};
async function copyTemplateFiles(options, templateDir, targetDir) {
    copyOrLink = options.dev ? linkRecursive : copy;
    const basePath = path.join(templateDir, baseDir);
    // 1. Copy base template to target directory
    await copyBaseFiles(options, basePath, targetDir);
    // 2. Add "parent" extensions (set via config.json#extend field)
    const expandedExtension = expandExtensions(options);
    options.extensions = expandedExtension;
    // 3. Copy extensions folders
    await copyExtensionsFiles(options, targetDir);
    // 4. Process templated files and generate output
    await processTemplatedFiles(options, basePath, targetDir);
    // 5. Initialize git repo to avoid husky error
    await execa("git", ["init"], { cwd: targetDir });
    await execa("git", ["checkout", "-b", "main"], { cwd: targetDir });
}

async function createProjectDirectory(projectName) {
    try {
        const result = await execa("mkdir", [projectName]);
        if (result.failed) {
            throw new Error("There was a problem running the mkdir command");
        }
    }
    catch (error) {
        throw new Error("Failed to create directory", { cause: error });
    }
    return true;
}

function installPackages(targetDir) {
    return projectInstall({
        cwd: targetDir,
        prefer: "yarn",
    });
}

// Checkout the latest release tag in a git submodule
async function checkoutLatestTag(submodulePath) {
    try {
        const { stdout } = await execa("git", ["tag", "-l", "--sort=-v:refname"], {
            cwd: submodulePath,
        });
        const tagLines = stdout.split("\n");
        if (tagLines.length > 0) {
            const latestTag = tagLines[0];
            await execa("git", ["-C", `${submodulePath}`, "checkout", latestTag]);
        }
        else {
            throw new Error(`No tags found in submodule at ${submodulePath}`);
        }
    }
    catch (error) {
        console.error("Error checking out latest tag:", error);
        throw error;
    }
}
async function createFirstGitCommit(targetDir, options) {
    try {
        // TODO: Move the logic for adding submodules to tempaltes
        if (options.extensions?.includes("foundry")) {
            const foundryWorkSpacePath = path.resolve(targetDir, "packages", "foundry");
            await execa("git", [
                "submodule",
                "add",
                "https://github.com/foundry-rs/forge-std",
                "lib/forge-std",
            ], {
                cwd: foundryWorkSpacePath,
            });
            await execa("git", [
                "submodule",
                "add",
                "https://github.com/OpenZeppelin/openzeppelin-contracts",
                "lib/openzeppelin-contracts",
            ], {
                cwd: foundryWorkSpacePath,
            });
            await execa("git", [
                "submodule",
                "add",
                "https://github.com/gnsps/solidity-bytes-utils",
                "lib/solidity-bytes-utils",
            ], {
                cwd: foundryWorkSpacePath,
            });
            await execa("git", ["submodule", "update", "--init", "--recursive"], {
                cwd: foundryWorkSpacePath,
            });
            await checkoutLatestTag(path.resolve(foundryWorkSpacePath, "lib", "forge-std"));
            await checkoutLatestTag(path.resolve(foundryWorkSpacePath, "lib", "openzeppelin-contracts"));
        }
        await execa("git", ["add", "-A"], { cwd: targetDir });
        await execa("git", ["commit", "-m", "Initial commit with 🏗️ Scaffold-Stylus", "--no-verify"], { cwd: targetDir });
        // Update the submodule, since we have checked out the latest tag in the previous step of foundry
        if (options.extensions?.includes("foundry")) {
            await execa("git", ["submodule", "update", "--init", "--recursive"], {
                cwd: path.resolve(targetDir, "packages", "foundry"),
            });
        }
    }
    catch (e) {
        // cast error as ExecaError to get stderr
        throw new Error("Failed to initialize git repository", {
            cause: e?.stderr ?? e,
        });
    }
}

// TODO: Instead of using execa, use prettier package from cli to format targetDir
async function prettierFormat(targetDir) {
    try {
        const result = await execa("yarn", ["format"], { cwd: targetDir });
        if (result.failed) {
            throw new Error("There was a problem running the format command");
        }
    }
    catch (error) {
        throw new Error("Failed to create directory", { cause: error });
    }
    return true;
}

async function renderOutroMessage(options) {
    let message = `
  \n
  ${chalk.bold.green("Congratulations!")} Your project has been scaffolded! 🎉

  ${chalk.bold("Next steps:")}
  
  ${chalk.dim("cd")} ${options.project}
  `;
    if (options.extensions.includes("hardhat") ||
        options.extensions.includes("foundry")) {
        message += `
    \t${chalk.bold("Start the local development node")}
    \t${chalk.dim("yarn")} chain
    `;
        if (options.extensions.includes("foundry")) {
            try {
                await execa("foundryup", ["-h"]);
            }
            catch (error) {
                message += `
      \t${chalk.bold.yellow("(NOTE: Foundryup is not installed in your system)")}
      \t${chalk.dim("Checkout: https://getfoundry.sh")}
      `;
            }
        }
        message += `
    \t${chalk.bold("In a new terminal window, deploy your contracts")}
    \t${chalk.dim("yarn")} deploy
   `;
    }
    message += `
  \t${chalk.bold("In a new terminal window, start the frontend")}
  \t${chalk.dim("yarn")} start
  `;
    message += `
  ${chalk.bold.green("Thanks for using Scaffold-Stylus 🙏, Happy Building!")}
  `;
    console.log(message);
}

async function createProject(options) {
    console.log(`\n`);
    const currentFileUrl = import.meta.url;
    const templateDirectory = path.resolve(decodeURI(fileURLToPath(currentFileUrl)), "../../templates");
    const targetDirectory = path.resolve(process.cwd(), options.project);
    const tasks = new Listr([
        {
            title: `📁 Create project directory ${targetDirectory}`,
            task: () => createProjectDirectory(options.project),
        },
        {
            title: `🚀 Creating a new Scaffold-Stylus app in ${chalk.green.bold(options.project)}`,
            task: () => copyTemplateFiles(options, templateDirectory, targetDirectory),
        },
        {
            title: `📦 Installing dependencies with yarn, this could take a while`,
            task: () => installPackages(targetDirectory),
            skip: () => {
                if (!options.install) {
                    return "Manually skipped";
                }
            },
        },
        {
            title: "🪄 Formatting files with prettier",
            task: () => prettierFormat(targetDirectory),
            skip: () => {
                if (!options.install) {
                    return "Skipping because prettier install was skipped";
                }
            },
        },
        {
            title: `📡 Initializing Git repository ${options.extensions.includes("foundry") ? "and submodules" : ""}`,
            task: () => createFirstGitCommit(targetDirectory, options),
        },
    ]);
    try {
        await tasks.run();
        renderOutroMessage(options);
    }
    catch (error) {
        console.log("%s Error occurred", chalk.red.bold("ERROR"), error);
        console.log("%s Exiting...", chalk.red.bold("Uh oh! 😕 Sorry about that!"));
    }
}

// TODO update smartContractFramework code with general extensions
function parseArgumentsIntoOptions(rawArgs) {
    const args = arg({
        "--install": Boolean,
        "-i": "--install",
        "--skip-install": Boolean,
        "--skip": "--skip-install",
        "-s": "--skip-install",
        "--dev": Boolean,
    }, {
        argv: rawArgs.slice(2).map((a) => a.toLowerCase()),
    });
    const install = args["--install"] ?? null;
    const skipInstall = args["--skip-install"] ?? null;
    const hasInstallRelatedFlag = install || skipInstall;
    const dev = args["--dev"] ?? false; // info: use false avoid asking user
    const project = args._[0] ?? null;
    return {
        project,
        install: hasInstallRelatedFlag ? install || !skipInstall : null,
        dev,
        extensions: null, // TODO add extensions flags
    };
}

const config = {
    questions: [
        typedQuestion({
            type: "single-select",
            name: "solidity-framework",
            message: "What solidity framework do you want to use?",
            extensions: ["hardhat", "foundry", null],
            default: "hardhat",
        }),
    ],
};

// default values for unspecified args
const defaultOptions = {
    project: "my-dapp-example",
    install: true,
    dev: false,
    extensions: [],
};
const invalidQuestionNames = ["project", "install"];
const nullExtensionChoice = {
    name: 'None',
    value: null
};
async function promptForMissingOptions(options) {
    const cliAnswers = Object.fromEntries(Object.entries(options).filter(([key, value]) => value !== null));
    const questions = [];
    questions.push({
        type: "input",
        name: "project",
        message: "Your project name:",
        default: defaultOptions.project,
        validate: (value) => value.length > 0,
    });
    const recurringAddFollowUps = (extensions, relatedQuestion) => {
        extensions.filter(extensionWithSubextensions).forEach((ext) => {
            const nestedExtensions = ext.extensions.map((nestedExt) => extensionDict[nestedExt]);
            questions.push({
                // INFO: assuming nested extensions are all optional. To change this,
                // update ExtensionDescriptor adding type, and update code here.
                type: "checkbox",
                name: `${ext.value}-extensions`,
                message: `Select optional extensions for ${ext.name}`,
                choices: nestedExtensions,
                when: (answers) => {
                    const relatedResponse = answers[relatedQuestion];
                    const wasMultiselectResponse = Array.isArray(relatedResponse);
                    return wasMultiselectResponse
                        ? relatedResponse.includes(ext.value)
                        : relatedResponse === ext.value;
                },
            });
            recurringAddFollowUps(nestedExtensions, `${ext.value}-extensions`);
        });
    };
    config.questions.forEach((question) => {
        if (invalidQuestionNames.includes(question.name)) {
            throw new Error(`The name of the question can't be "${question.name}". The invalid names are: ${invalidQuestionNames
                .map((w) => `"${w}"`)
                .join(", ")}`);
        }
        const extensions = question.extensions
            .filter(isExtension)
            .map((ext) => extensionDict[ext])
            .filter(isDefined);
        const hasNoneOption = question.extensions.includes(null);
        questions.push({
            type: question.type === "multi-select" ? "checkbox" : "list",
            name: question.name,
            message: question.message,
            choices: hasNoneOption ? [...extensions, nullExtensionChoice] : extensions,
        });
        recurringAddFollowUps(extensions, question.name);
    });
    questions.push({
        type: "confirm",
        name: "install",
        message: "Install packages?",
        default: defaultOptions.install,
    });
    const answers = await inquirer.prompt(questions, cliAnswers);
    const mergedOptions = {
        project: options.project ?? answers.project,
        install: options.install ?? answers.install,
        dev: options.dev ?? defaultOptions.dev,
        extensions: [],
    };
    config.questions.forEach((question) => {
        const { name } = question;
        const choice = [answers[name]].flat().filter(isDefined);
        mergedOptions.extensions.push(...choice);
    });
    const recurringAddNestedExtensions = (baseExtensions) => {
        baseExtensions.forEach((extValue) => {
            const nestedExtKey = `${extValue}-extensions`;
            const nestedExtensions = answers[nestedExtKey];
            if (nestedExtensions) {
                mergedOptions.extensions.push(...nestedExtensions);
                recurringAddNestedExtensions(nestedExtensions);
            }
        });
    };
    recurringAddNestedExtensions(mergedOptions.extensions);
    return mergedOptions;
}

const TITLE_TEXT = `
 ${chalk.bold.blue("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+")}
 ${chalk.bold.blue("| Create Scaffold-Stylus app |")}
 ${chalk.bold.blue("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+")}
`;
function renderIntroMessage() {
    console.log(TITLE_TEXT);
}

async function cli(args) {
    renderIntroMessage();
    const rawOptions = parseArgumentsIntoOptions(args);
    const options = await promptForMissingOptions(rawOptions);
    await createProject(options);
}

export { cli };
//# sourceMappingURL=cli.js.map

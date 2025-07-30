> ⚠️ Under active development.

# 🏗 create-stylus

CLI to create decentralized applications (dapps) using Scaffold-Stylus.

This is an alternative method of installing Scaffold-Stylus. Instead of directly [cloning SS](https://github.com/Arb-Stylus/scaffold-stylus?tab=readme-ov-file#quickstart), you can use create-stylus to create your own custom instance, where you can choose among several configurations and extensions.

<h4 align="center">
  <a href="https://github.com/Arb-Stylus/scaffold-stylus">SS Repo</a> |
  <a href="https://arb-stylus.github.io/scaffold-stylus-docs/">SS Docs</a> |
  <a href="https://www.scaffoldstylus.com/">SS Website</a>
</h4>

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started building Create-Stylus, follow the steps below:

1. Install dependencies.

```
yarn install
```

2. Build Create-Stylus:

```
yarn build
```

3. Test Create-Stylus:

```
yarn cli [...options]
```

## Extensions

Now you can choose from some preset extensions to ship your dApp faster! You can embed the Erc 20 indexer during the Scaffold-Stylus creation by running the following commands:

```bash
npx create-stylus@latest --extension erc-20
```

## Documentation

Visit our [docs](https://arb-stylus.github.io/scaffold-stylus-docs/) to learn how to start building with Scaffold-Stylus.

To know more about its features, check out our [website](https://www.scaffoldstylus.com/).

## Contributing to create-stylus

We welcome contributions to create-stylus and Scaffold-Stylus!

For more information and guidelines for contributing, please see:

- [create-stylus CONTRIBUTING.MD](https://github.com/Arb-Stylus/create-stylus/blob/main/CONTRIBUTING.md) if you want to contribute to the CLI.
- [Scaffold-Stylus CONTRIBUTING.MD](https://github.com/Arb-Stylus/scaffold-stylus/blob/main/CONTRIBUTING.md) if you want to contribute to SS base code.

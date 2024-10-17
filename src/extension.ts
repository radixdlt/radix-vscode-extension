import { prompts } from "./helpers/prompts";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { airdropXRD } from "./helpers/airdrop-xrd";
import {
  deployPackage,
  handlePackageDeploymentResponse,
} from "./helpers/deploy-package";
import * as fs from "fs";
import { AnalyticsModule } from "./helpers/analytics-module";
import { ScryptoTreeDataProvider } from "./helpers/scrypto-tree-data-provider";
import { getStokenetAccountWebView } from "./webviews/stokenet-account";
import { submitTransaction } from "./helpers/submit-transaction";
import { Account, StokenetAccountsModule } from "./helpers/stokenet-accounts";

const analytics = AnalyticsModule();

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  analytics.extension.event("extension_activated", vscode.env.sessionId);

  // vscode.ThemeIcon - https://code.visualstudio.com/api/references/icons-in-labels
  const account_icon = new vscode.ThemeIcon("account");
  const reset_icon = new vscode.ThemeIcon("refresh");
  const package_icon = new vscode.ThemeIcon("package");
  const publish_icon = new vscode.ThemeIcon("repo-push");
  const dapp_icon = new vscode.ThemeIcon("empty-window");
  const configs_icon = new vscode.ThemeIcon("settings-gear");
  const ledger_icon = new vscode.ThemeIcon("list-flat");
  const transfer_icon = new vscode.ThemeIcon("symbol-boolean");
  const fungible_token_icon = new vscode.ThemeIcon("symbol-constant");
  const call_function_icon = new vscode.ThemeIcon("symbol-function");
  const call_method_icon = new vscode.ThemeIcon("symbol-method");
  const nft_badge_icon = new vscode.ThemeIcon("verified-filled");
  const fungible_token_behaviors_icon = new vscode.ThemeIcon("symbol-misc");
  const dashboard_icon = new vscode.ThemeIcon("dashboard");
  const console_icon = new vscode.ThemeIcon("preview");
  const stokenetAccountsModule = StokenetAccountsModule({ context });
  // Tree View Items
  const templates = [
    {
      label: "Scrypto Package",
      icon: package_icon,
      command: {
        command: "scrypto.new-package",
        title: "Scrypto New Package",
        arguments: [],
      },
    },
    {
      label: "Create Radix dApp",
      icon: dapp_icon,
      command: {
        command: "create-radix-dapp",
        title: "Create Radix dApp",
        arguments: [],
      },
    },
  ];
  const resimCmd = [
    {
      label: "New Account",
      icon: account_icon,
      command: {
        command: "resim.new-account",
        title: "New Account",
        arguments: [],
      },
    },
    {
      label: "Reset",
      icon: reset_icon,
      command: { command: "resim.reset", title: "Reset", arguments: [] },
    },
    {
      label: "Publish",
      icon: publish_icon,
      command: { command: "resim.publish", title: "Publish", arguments: [] },
    },
    {
      label: "Show Configs",
      icon: configs_icon,
      command: {
        command: "resim.show-configs",
        title: "Show Configs",
        arguments: [],
      },
    },
    {
      label: "Show Ledger",
      icon: ledger_icon,
      command: {
        command: "resim.show-ledger",
        title: "Show Ledger",
        arguments: [],
      },
    },
    {
      label: "Transfer",
      icon: transfer_icon,
      command: { command: "resim.transfer", title: "Transfer", arguments: [] },
    },
    {
      label: "Create Fungible Token",
      icon: fungible_token_icon,
      command: {
        command: "resim.new-token-fixed",
        title: "Create Fungible Token",
        arguments: [],
      },
    },
    {
      label: "Call Function",
      icon: call_function_icon,
      command: {
        command: "resim.call-function",
        title: "Call Function",
        arguments: [],
      },
    },
    {
      label: "Call Method",
      icon: call_method_icon,
      command: {
        command: "resim.call-method",
        title: "Call Method",
        arguments: [],
      },
    },
    {
      label: "Create NFT Badge",
      icon: nft_badge_icon,
      command: {
        command: "resim.create-nft-badge",
        title: "Create NFT Badge",
        arguments: [],
      },
    },
    {
      label: "Create Fungible w/Behaviors",
      icon: fungible_token_behaviors_icon,
      command: {
        command: "resim.new-token-behaviors",
        title: "Create Fungible w/Behaviors",
        arguments: [],
      },
    },
  ];
  const stokenetCmd = [
    {
      label: "New Account",
      icon: account_icon,
      command: {
        command: "stokenet.new-account",
        title: "New Account",
        arguments: [],
      },
    },
    {
      label: "Get XRD",
      icon: transfer_icon,
      command: {
        command: "stokenet.faucet",
        title: "Airdrop XRD",
        arguments: [],
      },
    },
    {
      label: "Deploy Package",
      icon: publish_icon,
      command: {
        command: "stokenet.deploy-package",
        title: "Deploy Package",
        arguments: [],
      },
    },
    // { label: 'Instantiate Blueprint', icon: ledger_icon, command: { command: 'stokenet.instantiate-blueprint', title: 'Instantiate Blueprint', arguments: [] } },
    {
      label: "Open Dashboard",
      icon: dashboard_icon,
      command: {
        command: "stokenet.dashboard",
        title: "Open Dashboard",
        arguments: [],
      },
    },
    {
      label: "Open Dev Console",
      icon: console_icon,
      command: {
        command: "stokenet.console",
        title: "Open Console",
        arguments: [],
      },
    },
  ];

  // Tree View Data Providers
  const templateTreeDataProvider = new ScryptoTreeDataProvider(templates);
  const resimTreeDataProvider = new ScryptoTreeDataProvider(resimCmd);
  const stokenetTreeDataProvider = new ScryptoTreeDataProvider(stokenetCmd);

  // ######### Create New Project Commands #########
  // ######### Scrypto Package Command #########
  context.subscriptions.push(
    vscode.commands.registerCommand("scrypto.new-package", async () => {
      const packageName = (await prompts.packageName()) || "scrypto-package";
      const terminal = vscode.window.createTerminal(`Scrypto-CLI`);
      terminal.sendText(`scrypto new-package ${packageName}`);
      terminal.show();
      analytics.extension.event("new_scrypto_package");
    }),
  );

  // ######### Create Radix Dapp Command #########
  context.subscriptions.push(
    vscode.commands.registerCommand("create-radix-dapp", () => {
      const terminal = vscode.window.createTerminal(`Radix-Dapp`);
      terminal.sendText("npx create-radix-dapp");
      terminal.show();
      analytics.extension.event("new_radix_dapp");
    }),
  );

  // ######### Resim Commands #########
  // Resim New Account Command
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.new-account", () => {
      // check if there is a resim terminal open already
      let isResimTerminalOpen = false;
      vscode.window.terminals.forEach((terminal) => {
        if (terminal.name === "Resim") {
          terminal.sendText("resim new-account");
          terminal.show();
          isResimTerminalOpen = true;
          return;
        }
      });
      if (!isResimTerminalOpen) {
        const terminal = vscode.window.createTerminal(`Resim`);
        terminal.sendText("resim new-account");
        terminal.show();
      }
      analytics.resim.event("resim_new_account");
    }),
  );

  // Resim Reset Command
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.reset", () => {
      // check if there is a resim terminal open already
      let isResimTerminalOpen = false;
      vscode.window.terminals.forEach((terminal) => {
        if (terminal.name === "Resim") {
          terminal.sendText("resim reset");
          terminal.show();
          isResimTerminalOpen = true;
          return;
        }
      });
      if (!isResimTerminalOpen) {
        const terminal = vscode.window.createTerminal(`Resim`);
        terminal.sendText("resim reset");
        terminal.show();
      }
      analytics.resim.event("resim_reset");
    }),
  );

  // Resim Show Configs Command
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.show-configs", () => {
      // check if there is a resim terminal open already
      let isResimTerminalOpen = false;
      vscode.window.terminals.forEach((terminal) => {
        if (terminal.name === "Resim") {
          terminal.sendText("resim show-configs");
          terminal.show();
          isResimTerminalOpen = true;
          return;
        }
      });
      if (!isResimTerminalOpen) {
        const terminal = vscode.window.createTerminal(`Resim`);
        terminal.sendText("resim show-configs");
        terminal.show();
      }
    }),
  );

  // Resim Show Ledger Command
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.show-ledger", () => {
      // check if there is a resim terminal open already
      let isResimTerminalOpen = false;
      vscode.window.terminals.forEach((terminal) => {
        if (terminal.name === "Resim") {
          terminal.sendText("resim show-ledger");
          terminal.show();
          isResimTerminalOpen = true;
          return;
        }
      });
      if (!isResimTerminalOpen) {
        const terminal = vscode.window.createTerminal(`Resim`);
        terminal.sendText("resim show-ledger");
        terminal.show();
      }
    }),
  );

  // Resim Transfer Command
  // resim transfer [OPTIONS] <RESOURCE_ADDRESS>:<AMOUNT> <RECIPIENT>
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.transfer", async () => {
      const resourceAddress = await prompts.transferredResourceAddress();
      const amount = await prompts.transferredAmount();
      const recipientAccount = await prompts.recipientAddress();

      if (resourceAddress && amount && recipientAccount) {
        const command = `resim transfer ${resourceAddress}:${amount} ${recipientAccount}`;

        // check if there is a resim terminal open already
        let isResimTerminalOpen = false;
        vscode.window.terminals.forEach((terminal) => {
          if (terminal.name === "Resim") {
            // Use the command here
            terminal.sendText(command);
            terminal.show();
            isResimTerminalOpen = true;
            return;
          }
        });
        if (!isResimTerminalOpen) {
          const terminal = vscode.window.createTerminal(`Resim`);
          terminal.sendText(command);
          terminal.show();
        }
      } else {
        vscode.window.showErrorMessage(
          "You must provide a resource address, amount, and recipient account",
        );
      }
    }),
  );

  // Resim Publish Package Command
  // TODO - add a check to see if the terminal location contains the scrypto-package
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.publish", async () => {
      // Prompt for the relative path to the package
      const packagePath = await prompts.relativePackagePath();
      if (packagePath) {
        const terminal = vscode.window.createTerminal(`Publish Package`);
        terminal.sendText(`cd ${packagePath} && resim publish .`);
        terminal.show();
      } else {
        const terminal = vscode.window.createTerminal(`Publish Package`);
        terminal.sendText(`resim publish .`);
        terminal.show();
      }
      analytics.resim.event("resim_publish_package");
    }),
  );

  // Resim New Simple Fungible Token Fixed Supply Command
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.new-token-fixed", async () => {
      const amount = await prompts.amount();

      if (amount) {
        const command = `resim new-token-fixed ${amount}`;

        // check if there is a resim terminal open already
        let isResimTerminalOpen = false;
        vscode.window.terminals.forEach((terminal) => {
          if (terminal.name === "Resim") {
            // Use the command here
            terminal.sendText(command);
            terminal.show();
            isResimTerminalOpen = true;
            return;
          }
        });
        if (!isResimTerminalOpen) {
          const terminal = vscode.window.createTerminal(`Resim`);
          terminal.sendText(command);
          terminal.show();
        }
      } else {
        vscode.window.showErrorMessage(
          "You must provide an amount of tokens to create",
        );
      }
    }),
  );

  // Resim Call Function Command
  // resim call-function <package_address> <blueprint_name> <function> <args>
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.call-function", async () => {
      // TODO - Add validation to the input boxes to statically check for the correct input
      const packageAddress = await prompts.packageAddress();
      const blueprintName = await prompts.blueprintName();
      const functionName = await prompts.functionName();
      const args = await prompts.functionArguments();

      if (packageAddress && blueprintName && functionName) {
        const command = `resim call-function ${packageAddress} ${blueprintName} ${functionName} ${args}`;

        // check if there is a resim terminal open already
        let isResimTerminalOpen = false;
        vscode.window.terminals.forEach((terminal) => {
          if (terminal.name === "Resim") {
            // Use the command here
            terminal.sendText(command);
            terminal.show();
            isResimTerminalOpen = true;
            return;
          }
        });
        if (!isResimTerminalOpen) {
          const terminal = vscode.window.createTerminal(`Resim`);
          terminal.sendText(command);
          terminal.show();
        }
      } else {
        vscode.window.showErrorMessage(
          "You must provide a package address, blueprint name, function name and any required arguments",
        );
      }
    }),
  );

  // Resim Call Method Command
  // resim call-method <component_address> <method> <args>
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.call-method", async () => {
      const componentAddress = await prompts.componentAddress();
      const methodName = await prompts.methodName();
      const args = await prompts.methodArguments();

      if (componentAddress && methodName) {
        const command = `resim call-method ${componentAddress} ${methodName} ${args}`;

        // check if there is a resim terminal open already
        let isResimTerminalOpen = false;
        vscode.window.terminals.forEach((terminal) => {
          if (terminal.name === "Resim") {
            // Use the command here
            terminal.sendText(command);
            terminal.show();
            isResimTerminalOpen = true;
            return;
          }
        });
        if (!isResimTerminalOpen) {
          const terminal = vscode.window.createTerminal(`Resim`);
          terminal.sendText(command);
          terminal.show();
        }
      } else {
        vscode.window.showErrorMessage(
          "You must provide a component address, method name, and any required arguments",
        );
      }
    }),
  );

  // Resim Create Simple NFT Badge Command
  // resim new-simple-badge
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.create-nft-badge", async () => {
      const command = `resim new-simple-badge`;

      // check if there is a resim terminal open already
      let isResimTerminalOpen = false;
      vscode.window.terminals.forEach((terminal) => {
        if (terminal.name === "Resim") {
          // Use the command here
          terminal.sendText(command);
          terminal.show();
          isResimTerminalOpen = true;
          return;
        }
      });
      if (!isResimTerminalOpen) {
        const terminal = vscode.window.createTerminal(`Resim`);
        terminal.sendText(command);
        terminal.show();
      }
    }),
  );

  // Resim Create Fungible Token with Behaviors Command
  // resim run create-fungible-token-with-behaviors.rtm
  // TODO - Create custom manifest file for the behaviors
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.new-token-behaviors", async () => {
      // Test with simple manifest first
      const command = `resim run ${__dirname}/assets/manifests/token_behaviors.rtm`;

      // check if there is a resim terminal open already
      let isResimTerminalOpen = false;
      vscode.window.terminals.forEach((terminal) => {
        if (terminal.name === "Resim") {
          // Use the command here
          terminal.sendText(command);
          terminal.show();
          isResimTerminalOpen = true;
          return;
        }
      });
      if (!isResimTerminalOpen) {
        const terminal = vscode.window.createTerminal(`Resim`);
        terminal.sendText(command);
        terminal.show();
      }
    }),
  );

  // ######### Stokenet Commands #########
  context.subscriptions.push(
    vscode.commands.registerCommand("stokenet.new-account", async () => {
      const accountName = await prompts.accountName();
      if (accountName) {
        const account = await stokenetAccountsModule.create(accountName);

        airdropXRD(account.address);
        // Create and show a new webview
        const panel = vscode.window.createWebviewPanel(
          "stokenetAccount", // Identifies the type of the webview. Used internally
          accountName, // Title of the panel displayed to the user
          vscode.ViewColumn.One, // Editor column to show the new webview panel in.
          {}, // Webview options. More on these later.
        );
        // Set its HTML content
        panel.webview.html = getStokenetAccountWebView(account);
      }
      analytics.stokenet.event("stokenet_new_account");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stokenet.faucet", async () => {
      // prompt the user for the account address to send the XRD to using AirdropXRD
      const accountAddress = await prompts.recipientAddress();
      if (accountAddress) {
        airdropXRD(accountAddress);
        vscode.window.showInformationMessage(
          `Sending XRD to account: ${accountAddress}`,
        );
      }
      // TODO show account entity details from gateway
      analytics.stokenet.event("stokenet_airdrop_xrd");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stokenet.deploy-package", async () => {
      function isFileExtensionValid(
        filePath: string,
        extension: string,
      ): boolean {
        const fileExtension = filePath.slice(filePath.lastIndexOf("."));
        return fileExtension === extension;
      }

      async function getPayerAccount(): Promise<Account | undefined> {
        return stokenetAccountsModule.pickAccount(
          "Choose an account to pay for the deployment",
        );
      }
      // Check the workspace context for the package path and propmpt to update or continue if it exists
      if (
        !context.workspaceState.get("packageWasmPath") ||
        !context.workspaceState.get("packageRpdPath")
      ) {
        // prompt the user for the package path

        const packageWasmPath = await prompts.wasmPath();
        const packageRpdPath = await prompts.rpdPath();
        const wasmPathisValid =
          packageWasmPath &&
          fs.existsSync(packageWasmPath) &&
          fs.lstatSync(packageWasmPath).isFile() &&
          isFileExtensionValid(packageWasmPath, ".wasm");
        const rpdPathisValid =
          packageRpdPath &&
          fs.existsSync(packageRpdPath) &&
          fs.lstatSync(packageRpdPath).isFile() &&
          isFileExtensionValid(packageRpdPath, ".rpd");
        if (!wasmPathisValid || !rpdPathisValid) {
          // Path is invalid, display an error message
          vscode.window.showErrorMessage(
            "Invalid package path. Please check the path and ensure you have built the package with the `scypto build` command.",
          );
          // Prompt the user to enter the path again or clear the workspace context
          const userChoice = await vscode.window.showQuickPick(
            ["Clear Workspace Context", "Update Package Paths"],
            { placeHolder: "Choose an option" },
          );
          if (userChoice === "Clear Workspace Context") {
            context.workspaceState.update("packageWasmPath", undefined);
            context.workspaceState.update("packageRpdPath", undefined);
            return;
          } else if (userChoice === "Update Package Paths") {
            const packageWasmPath = await prompts.wasmPath();
            const packageRpdPath = await prompts.rpdPath();
            // check if the paths are valid
            const wasmPathisValid =
              packageWasmPath &&
              fs.existsSync(packageWasmPath) &&
              fs.lstatSync(packageWasmPath).isFile() &&
              isFileExtensionValid(packageWasmPath, ".wasm");
            const rpdPathisValid =
              packageRpdPath &&
              fs.existsSync(packageRpdPath) &&
              fs.lstatSync(packageRpdPath).isFile() &&
              isFileExtensionValid(packageRpdPath, ".rpd");
            if (!wasmPathisValid || !rpdPathisValid) {
              // Paths are invalid, display an error message
              vscode.window.showErrorMessage(
                "Invalid package path. Please check the path and ensure you have built the package with the `scypto build` command.",
              );
              return;
            } else {
              context.workspaceState.update("packageWasmPath", packageWasmPath);
              context.workspaceState.update("packageRpdPath", packageRpdPath);
              // prompt the user to choose an account to pay for the deployment
              const payerAccount = await getPayerAccount();
              vscode.window.showInformationMessage(
                `Deploying package to stokenet from @path ${packageWasmPath}`,
              );
              // compose the deploy package transaction and send to gateway
              deployPackage(payerAccount, packageWasmPath, packageRpdPath).then(
                (receipt) => handlePackageDeploymentResponse(receipt),
              );
              return;
            }
          }
        } else {
          // If the paths are valid, update the workspace context
          context.workspaceState.update("packageWasmPath", packageWasmPath);
          context.workspaceState.update("packageRpdPath", packageRpdPath);
          // prompt the user to choose an account to pay for the deployment
          const payerAccount = await getPayerAccount();
          vscode.window.showInformationMessage(
            `Deploying package to stokenet from @path ${packageWasmPath}`,
          );
          // compose the deploy package transaction and send to gateway
          deployPackage(payerAccount, packageWasmPath, packageRpdPath).then(
            (receipt) => handlePackageDeploymentResponse(receipt),
          );
          return;
        }
      } else {
        // If the package path is already set, get it from the workspace context
        const packageWasmPath =
          context.workspaceState.get<string>("packageWasmPath");
        const packageRpdPath =
          context.workspaceState.get<string>("packageRpdPath");
        // check if the path is valid if not display an error message
        const wasmPathisValid =
          packageWasmPath &&
          fs.existsSync(packageWasmPath) &&
          fs.lstatSync(packageWasmPath).isFile() &&
          isFileExtensionValid(packageWasmPath, ".wasm");
        const rpdPathisValid =
          packageRpdPath &&
          fs.existsSync(packageRpdPath) &&
          fs.lstatSync(packageRpdPath).isFile() &&
          isFileExtensionValid(packageRpdPath, ".rpd");
        if (!wasmPathisValid || !rpdPathisValid) {
          // Path is invalid, display an error message
          vscode.window.showErrorMessage(
            "Invalid package path. Please check the path and ensure you have built the package with the `scypto build` command.",
          );
          // Prompt the user to enter the path again or clear the workspace context
          const userChoice = await vscode.window.showQuickPick(
            ["Clear Workspace Context", "Update Package Paths"],
            { placeHolder: "Choose an option" },
          );
          if (userChoice === "Clear Workspace Context") {
            context.workspaceState.update("packageWasmPath", undefined);
            context.workspaceState.update("packageRpdPath", undefined);
            return;
          } else if (userChoice === "Update Package Paths") {
            const packageWasmPath = await prompts.wasmPath();
            const packageRpdPath = await prompts.rpdPath();

            // check if the paths are valid
            const wasmPathisValid =
              packageWasmPath &&
              fs.existsSync(packageWasmPath) &&
              fs.lstatSync(packageWasmPath).isFile() &&
              isFileExtensionValid(packageWasmPath, ".wasm");
            const rpdPathisValid =
              packageRpdPath &&
              fs.existsSync(packageRpdPath) &&
              fs.lstatSync(packageRpdPath).isFile() &&
              isFileExtensionValid(packageRpdPath, ".rpd");
            if (!wasmPathisValid || !rpdPathisValid) {
              // Paths are invalid, display an error message
              vscode.window.showErrorMessage(
                "Invalid package path. Please check the path and ensure you have built the package with the `scypto build` command.",
              );
              return;
            } else {
              context.workspaceState.update("packageWasmPath", packageWasmPath);
              context.workspaceState.update("packageRpdPath", packageRpdPath);
              // prompt the user to choose an account to pay for the deployment
              const payerAccount = await getPayerAccount();
              vscode.window.showInformationMessage(
                `Deploying package to stokenet from @path ${packageWasmPath}`,
              );
              // compose the deploy package transaction and send to gateway
              deployPackage(payerAccount, packageWasmPath, packageRpdPath).then(
                (receipt) => handlePackageDeploymentResponse(receipt),
              );
              return;
            }
          }
        } else {
          // If the paths are valid prompt the user to update the package path or continue with the existing path
          const updatePaths = await vscode.window.showQuickPick(
            ["Update Paths", "Continue with Deployment"],
            { placeHolder: "Choose an option" },
          );
          if (updatePaths === "Update Paths") {
            const packageWasmPath = await prompts.wasmPath();
            const packageRpdPath = await prompts.rpdPath();

            // check if the paths are valid
            const wasmPathisValid =
              packageWasmPath &&
              fs.existsSync(packageWasmPath) &&
              fs.lstatSync(packageWasmPath).isFile() &&
              isFileExtensionValid(packageWasmPath, ".wasm");
            const rpdPathisValid =
              packageRpdPath &&
              fs.existsSync(packageRpdPath) &&
              fs.lstatSync(packageRpdPath).isFile() &&
              isFileExtensionValid(packageRpdPath, ".rpd");
            if (!wasmPathisValid || !rpdPathisValid) {
              // Path is invalid, display an error message
              vscode.window.showErrorMessage(
                "Invalid package path. Please check the path and ensure you have built the package with the `scypto build` command.",
              );
              // Prompt the user to enter the path again or clear the workspace context
              const userChoice = await vscode.window.showQuickPick(
                ["Clear Workspace Context", "Update Package Paths"],
                { placeHolder: "Choose an option" },
              );
              if (userChoice === "Clear Workspace Context") {
                context.workspaceState.update("packageWasmPath", undefined);
                context.workspaceState.update("packageRpdPath", undefined);
                return;
              } else if (userChoice === "Update Package Paths") {
                const packageWasmPath = await prompts.wasmPath();
                const packageRpdPath = await prompts.rpdPath();

                // check if the paths are valid
                const wasmPathisValid =
                  packageWasmPath &&
                  fs.existsSync(packageWasmPath) &&
                  fs.lstatSync(packageWasmPath).isFile() &&
                  isFileExtensionValid(packageWasmPath, ".wasm");
                const rpdPathisValid =
                  packageRpdPath &&
                  fs.existsSync(packageRpdPath) &&
                  fs.lstatSync(packageRpdPath).isFile() &&
                  isFileExtensionValid(packageRpdPath, ".rpd");
                if (!wasmPathisValid || !rpdPathisValid) {
                  // Paths are invalid, display an error message
                  vscode.window.showErrorMessage(
                    "Invalid package path. Please check the path and ensure you have built the package with the `scypto build` command.",
                  );
                  return;
                } else {
                  context.workspaceState.update(
                    "packageWasmPath",
                    packageWasmPath,
                  );
                  context.workspaceState.update(
                    "packageRpdPath",
                    packageRpdPath,
                  );
                  // TODO prompt the user to choose an account to pay for the deployment
                  const payerAccount = await getPayerAccount();
                  vscode.window.showInformationMessage(
                    `Deploying package to stokenet from @path ${packageWasmPath}`,
                  );
                  // compose the deploy package transaction and send to gateway
                  deployPackage(
                    payerAccount,
                    packageWasmPath,
                    packageRpdPath,
                  ).then((reciept) => handlePackageDeploymentResponse(reciept));
                  return;
                }
              }
            } else {
              // If the paths are valid, update the workspace context
              context.workspaceState.update("packageWasmPath", packageWasmPath);
              context.workspaceState.update("packageRpdPath", packageRpdPath);
              // TODO prompt the user to choose an account to pay for the deployment
              const payerAccount = await getPayerAccount();
              vscode.window.showInformationMessage(
                `Deploying package to stokenet from @path ${packageWasmPath}`,
              );
              // compose the deploy package transaction and send to gateway
              deployPackage(payerAccount, packageWasmPath, packageRpdPath).then(
                (receipt) => handlePackageDeploymentResponse(receipt),
              );
              return;
            }
          }
          // continue deployment with the existing paths
          const payerAccount = await getPayerAccount();
          vscode.window.showInformationMessage(
            `Deploying package to stokenet from @path ${packageWasmPath}`,
          );
          // compose the deploy package transaction and send to gateway
          deployPackage(payerAccount, packageWasmPath, packageRpdPath).then(
            (receipt) => handlePackageDeploymentResponse(receipt),
          );
          return;
        }
      }
      analytics.stokenet.event("stokenet_deploy_package");
    }),
  );

  // context.subscriptions.push(vscode.commands.registerCommand('stokenet.instantiate-blueprint', async () => {
  // 	vscode.window.showInformationMessage('Stokenet Instantiate Blueprint');
  // }));

  context.subscriptions.push(
    vscode.commands.registerCommand("stokenet.dashboard", async () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://stokenet-dashboard.radixdlt.com"),
      );
      analytics.stokenet.event("stokenet_dashboard");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("stokenet.console", async () => {
      vscode.env.openExternal(
        vscode.Uri.parse("https://stokenet-console.radixdlt.com"),
      );
      analytics.stokenet.event("stokenet_console");
    }),
  );

  // Remove Account Command
  context.subscriptions.push(
    vscode.commands.registerCommand("stokenet.remove-account", async () => {
      const accountToRemove = await stokenetAccountsModule.pickAccount(
        "Select the account you want to remove",
      );

      if (accountToRemove) {
        await stokenetAccountsModule.remove(accountToRemove);

        vscode.window.showInformationMessage(
          `${accountToRemove.label} successfully removed from accounts list. NOTE: This account still exists on Stokenet`,
        );
      }
    }),
  );

  // Stoknet Account Detail Command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "account.account-detail",
      async (virtualAccount: string) => {
        const selectedAccount =
          stokenetAccountsModule.getAccountByAddress(virtualAccount);

        if (selectedAccount) {
          // Create and show a new webview
          const panel = vscode.window.createWebviewPanel(
            "stokenetAccount", // Identifies the type of the webview. Used internally
            selectedAccount.label, // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {}, // Webview options. More on these later.
          );
          // Display the account properties in the webview
          panel.webview.html = getStokenetAccountWebView(selectedAccount);
        } else {
          vscode.window.showErrorMessage("Account not found");
        }
        analytics.stokenet.event(
          "stokenet_account_detail",
          selectedAccount?.address,
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "stokenet.submit-transaction",
      async (a) => {
        const path = a.path;
        const accountToSubmitWith = await stokenetAccountsModule.pickAccount(
          "Select the account you want to sign transaction with",
        );

        if (accountToSubmitWith) {
          const result = await submitTransaction(accountToSubmitWith, path);

          let copyAction = "Copy Transaction Intent Hash";
          vscode.window
            .showInformationMessage(`Transaction Submitted`, copyAction)
            .then((selection) => {
              if (selection === copyAction) {
                vscode.env.clipboard.writeText(result);
              }
            });
        }
      },
    ),
  );

  // Add tree views to the extension context
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "create-new-project",
      templateTreeDataProvider,
    ),
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "resim-commands",
      resimTreeDataProvider,
    ),
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "stokenet-commands",
      stokenetTreeDataProvider,
    ),
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "stokenet-accounts",
      stokenetAccountsModule.getScryptoTreeDataProvider(),
    ),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

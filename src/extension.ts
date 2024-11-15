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
import { AnalyticsModule } from "./modules/analytics-module";
import { ScryptoTreeDataProvider } from "./helpers/scrypto-tree-data-provider";
import { getStokenetAccountWebView } from "./webviews/stokenet-account";
import { submitTransaction } from "./helpers/submit-transaction";
import {
  Account,
  StokenetAccountsModule,
} from "./modules/stokenet-accounts-module";
import { ResimModule } from "./modules/resim-module";
import { treeItem } from "./helpers/tree-item";
import { hasExtension } from "./helpers/has-extension";
import { extname } from "path";
import { isFile } from "./helpers/is-file";
import { isFileWithExtension } from "./helpers/is-file-with-extension";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // vscode.ThemeIcon - https://code.visualstudio.com/api/references/icons-in-labels
  const account_icon = new vscode.ThemeIcon("account");
  const package_icon = new vscode.ThemeIcon("package");
  const publish_icon = new vscode.ThemeIcon("repo-push");
  const dapp_icon = new vscode.ThemeIcon("empty-window");
  const transfer_icon = new vscode.ThemeIcon("symbol-boolean");
  const dashboard_icon = new vscode.ThemeIcon("dashboard");
  const console_icon = new vscode.ThemeIcon("preview");

  const analytics = AnalyticsModule();
  const resimModule = ResimModule({ context });
  const stokenetAccountsModule = StokenetAccountsModule({ context });

  analytics.extension.event("extension_activated", vscode.env.sessionId);

  // Tree View Items
  const templates = [
    treeItem("Scrypto Package", "scrypto.new-package", package_icon),
    treeItem("Create Radix dApp", "create-radix-dapp", dapp_icon),
  ];

  const stokenetCmd = [
    treeItem("New Account", "stokenet.new-account", account_icon),
    treeItem("Get XRD", "stokenet.faucet", transfer_icon),
    treeItem("Deploy Package", "stokenet.deploy-package", publish_icon),
    treeItem("Open Dashboard", "stokenet.dashboard", dashboard_icon),
    treeItem("Open Dev Console", "stokenet.console", console_icon),
    treeItem(
      "Submit Transaction Manifest",
      "stokenet.submit-transaction",
      transfer_icon,
    ),
  ];

  // Tree View Data Providers
  const templateTreeDataProvider = new ScryptoTreeDataProvider(templates);
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
      resimModule.sendTextAndFocus("resim new-account");
      analytics.resim.event("resim_new_account");
    }),
  );

  // Resim Reset Command
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.reset", () => {
      resimModule.sendTextAndFocus("resim reset");
      analytics.resim.event("resim_reset");
    }),
  );

  // Resim Show Configs Command
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.show-configs", () => {
      resimModule.sendTextAndFocus("resim show-configs");
    }),
  );

  // Resim Show Ledger Command
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.show-ledger", () => {
      resimModule.sendTextAndFocus("resim show-ledger");
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

        resimModule.sendTextAndFocus(command);
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
        resimModule.sendTextAndFocus(command);
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
        resimModule.sendTextAndFocus(command);
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
        resimModule.sendTextAndFocus(command);
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
      resimModule.sendTextAndFocus(command);
    }),
  );

  // Resim Create Fungible Token with Behaviors Command
  // resim run create-fungible-token-with-behaviors.rtm
  // TODO - Create custom manifest file for the behaviors
  context.subscriptions.push(
    vscode.commands.registerCommand("resim.new-token-behaviors", async () => {
      // Test with simple manifest first
      const command = `resim run ${__dirname}/assets/manifests/token_behaviors.rtm`;
      resimModule.sendTextAndFocus(command);
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
    vscode.commands.registerCommand("stokenet.deploy-package", async (ev) => {
      const selectedFile = ev && ev.path ? (ev.path as string) : undefined;

      const proceedWithDeployment = async (
        packageWasmPath: string,
        packageRpdPath: string,
      ) => {
        const payerAccount = await stokenetAccountsModule.pickAccount(
          "Choose an account to pay for the deployment",
        );
        vscode.window.showInformationMessage(
          `Deploying package to stokenet from ${packageWasmPath}`,
        );
        return deployPackage(
          payerAccount,
          packageWasmPath,
          packageRpdPath,
        ).then((receipt) => handlePackageDeploymentResponse(receipt));
      };

      // Check if the command was triggered from the context menu
      if (selectedFile) {
        const selectedFileExtension = extname(selectedFile);
        const selectedFileNoExtension = selectedFile.substr(
          0,
          selectedFile.lastIndexOf(selectedFileExtension),
        );
        const otherFileExtension =
          selectedFileExtension === ".wasm" ? ".rpd" : ".wasm";

        // Check if there's corresponding wasm/rpd file in the same directory
        if (isFile(`${selectedFileNoExtension}${otherFileExtension}`)) {
          const packageWasmPath = `${selectedFileNoExtension}.wasm`;
          const packageRpdPath = `${selectedFileNoExtension}.rpd`;
          return proceedWithDeployment(packageWasmPath, packageRpdPath);
        } else {
          vscode.window.showErrorMessage(
            "There's no corresponding wasm/rpd file in the same directory",
          );
        }
      }

      const contextPackageWasmPath = context.workspaceState.get<
        string | undefined
      >("packageWasmPath");
      const contextPackageRpdPath = context.workspaceState.get<
        string | undefined
      >("packageRpdPath");

      if (
        isFileWithExtension(contextPackageWasmPath) &&
        isFileWithExtension(contextPackageRpdPath)
      ) {
        return proceedWithDeployment(
          contextPackageWasmPath,
          contextPackageRpdPath,
        );
      }

      context.workspaceState.update("packageWasmPath", undefined);
      context.workspaceState.update("packageRpdPath", undefined);

      const packageWasmPath = await prompts.wasmPath();
      const packageRpdPath = await prompts.rpdPath();
      const isWasmFilePathValid = isFileWithExtension(packageWasmPath, ".wasm");
      const isRpdFilePathValid = isFileWithExtension(packageRpdPath, ".rpd");

      if (isRpdFilePathValid && isWasmFilePathValid) {
        context.workspaceState.update("packageWasmPath", packageWasmPath);
        context.workspaceState.update("packageRpdPath", packageRpdPath);
        return proceedWithDeployment(packageWasmPath, packageRpdPath);
      } else {
        vscode.window.showErrorMessage(
          "Invalid rpd/wasm paths. Please provide correct absolute paths to RPD and WASM files.",
        );
      }
      analytics.stokenet.event("stokenet_deploy_package");
    }),
  );

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
    vscode.commands.registerCommand("resim.submit-transaction", async (a) => {
      const path = (a && a.path) || (await prompts.rtmPath());

      if (path) {
        const command = `resim run ${path}`;
        resimModule.sendTextAndFocus(command);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "stokenet.submit-transaction",
      async (a) => {
        const path = (a && a.path) || (await prompts.rtmPath());
        const accountToSubmitWith = await stokenetAccountsModule.pickAccount(
          "Select the account you want to sign transaction with",
        );

        if (accountToSubmitWith && path) {
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
      "stokenet-commands",
      stokenetTreeDataProvider,
    ),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

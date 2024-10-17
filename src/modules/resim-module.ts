import * as vscode from "vscode";
import { treeItem } from "../helpers/tree-item";
import { ScryptoTreeDataProvider } from "../helpers/scrypto-tree-data-provider";

const resimCommands = [
  treeItem("New Account", "resim.new-account", new vscode.ThemeIcon("account")),
  treeItem("Reset", "resim.reset", new vscode.ThemeIcon("refresh")),
  treeItem("Publish", "resim.publish", new vscode.ThemeIcon("repo-push")),
  treeItem(
    "Show Configs",
    "resim.show-configs",
    new vscode.ThemeIcon("settings-gear"),
  ),
  treeItem(
    "Show Ledger",
    "resim.show-ledger",
    new vscode.ThemeIcon("list-flat"),
  ),
  treeItem(
    "Transfer",
    "resim.transfer",
    new vscode.ThemeIcon("symbol-boolean"),
  ),
  treeItem(
    "Create Fungible Token",
    "resim.new-token-fixed",
    new vscode.ThemeIcon("symbol-constant"),
  ),
  treeItem(
    "Call Function",
    "resim.call-function",
    new vscode.ThemeIcon("symbol-function"),
  ),
  treeItem(
    "Call Method",
    "resim.call-method",
    new vscode.ThemeIcon("symbol-method"),
  ),
  treeItem(
    "Create NFT Badge",
    "resim.create-nft-badge",
    new vscode.ThemeIcon("verified-filled"),
  ),
  treeItem(
    "Submit Transaction Manifest",
    "resim.submit-transaction",
    new vscode.ThemeIcon("symbol-boolean"),
  ),
  treeItem(
    "Create Fungible w/Behaviors",
    "resim.new-token-behaviors",
    new vscode.ThemeIcon("symbol-misc"),
  ),
];

/**
 * Responsible for registering all items in "Resim" tree view.
 * Provides utility function for sending text to "Resim" terminal.
 */
export const ResimModule = ({
  context,
}: {
  context: vscode.ExtensionContext;
}) => {
  const treeDataProvider = new ScryptoTreeDataProvider(resimCommands);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("resim-commands", treeDataProvider),
  );

  const terminal = () => {
    const terminal = vscode.window.terminals.find(
      (terminal) => terminal.name === "Resim",
    );
    return terminal ? terminal : vscode.window.createTerminal(`Resim`);
  };

  return {
    /**
     * Sends text to "Resim" terminal and focuses on "Resim" terminal
     * @param command
     */
    sendTextAndFocus: (command: string) => {
      const _terminal = terminal();
      _terminal.sendText(command);
      _terminal.show();
    },
  };
};

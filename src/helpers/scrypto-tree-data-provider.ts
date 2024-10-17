import path from "path";
import * as vscode from "vscode";

export class ScryptoTreeDataProvider
  implements vscode.TreeDataProvider<string>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    string | undefined | null | void
  > = new vscode.EventEmitter<string | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private items: {
    label: string;
    icon: vscode.ThemeIcon | string;
    command: vscode.Command;
  }[];

  constructor(
    items: {
      label: string;
      icon: vscode.ThemeIcon | string;
      command: vscode.Command;
    }[]
  ) {
    this.items = items;
  }

  getTreeItem(element: string): vscode.TreeItem {
    const item = this.items.find((item) => item.label === element);
    if (item) {
      let iconPath: vscode.ThemeIcon | vscode.Uri;
      if (typeof item.icon === "string") {
        iconPath = vscode.Uri.file(path.join(__dirname, item.icon));
      } else {
        iconPath = item.icon;
      }

      return {
        label: item.label,
        iconPath: iconPath,
        id: item.label,
        collapsibleState: vscode.TreeItemCollapsibleState.None,
        command: {
          command: item.command.command,
          title: item.command.title,
          arguments: [item.command.arguments],
        },
      };
    }
    return new vscode.TreeItem(element);
  }

  getChildren(element?: string): Thenable<string[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve(this.items.map((item) => item.label));
    }
  }
  // method to add new items to the tree view and refresh the view
  addNewItem(item: {
    label: string;
    icon: vscode.ThemeIcon | string;
    command: vscode.Command;
  }) {
    this.items.push(item);
    this._onDidChangeTreeData.fire();
  }
  // method to remove items from the tree view and refresh the view
  removeItem(label: string) {
    this.items = this.items.filter((item) => item.label !== label);
    this._onDidChangeTreeData.fire();
  }
}

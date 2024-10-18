import * as vscode from "vscode";

export const treeItem = (
  label: string,
  command: string,
  icon: vscode.ThemeIcon,
  args: unknown[] = [],
) => ({
  label,
  icon,
  command: {
    command,
    title: label,
    arguments: args,
  },
});

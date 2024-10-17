import * as vscode from "vscode";

export const ResimModule = () => {
  const terminal = () => {
    const terminal = vscode.window.terminals.find(
      (terminal) => terminal.name === "Resim",
    );
    return terminal ? terminal : vscode.window.createTerminal(`Resim`);
  };

  return {
    sendTextAndFocus: (text: string) => {
      const _terminal = terminal();
      _terminal.sendText(text);
      _terminal.show();
    },
  };
};

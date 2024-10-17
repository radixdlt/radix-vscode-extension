import * as vscode from "vscode";
export const textPrompt = (message: string) =>
  vscode.window.showInputBox({
    prompt: message,
    ignoreFocusOut: true,
  });

// TODO - Add validation to the input boxes to statically check for the correct input
export const prompts = {
  wasmPath: () => textPrompt("Enter the path to the package Wasm file"),
  rpdPath: () => textPrompt("Enter the path to the package Rpd file"),
  amount: () => textPrompt("Enter the amount"),
  accountName: () => textPrompt("Enter the account name"),
  transferredResourceAddress: () =>
    textPrompt(
      "Enter the resource address for the resource you wish to transfer",
    ),
  transferredAmount: () => textPrompt("Enter the amount you wish to transfer"),
  recipientAddress: () => textPrompt("Enter the recipient account address"),
  relativePackagePath: () =>
    textPrompt("Enter the relative path to the package"),
  packageAddress: () => textPrompt("Enter the package address"),
  blueprintName: () => textPrompt("Enter the blueprint name"),
  functionName: () => textPrompt("Enter the function name"),
  functionArguments: () =>
    textPrompt("Enter the function arguments seperated by a blank space"), // TODO add logic to handle multiple arguments more elegantly
  componentAddress: () => textPrompt("Enter the component address"),
  methodName: () => textPrompt("Enter the method name"),
  methodArguments: () =>
    textPrompt("Enter the method arguments seperated by a blank space"), // TODO add logic to handle multiple arguments more elegantly
  packageName: () =>
    vscode.window.showInputBox({
      prompt: "Enter the package name",
      placeHolder: "scrypto-package",
      value: "",
      ignoreFocusOut: true,
      valueSelection: [-1, -1],
    }),
  rtmPath: () =>
    textPrompt("Enter the path to the `*.rtm` file you want to submit"),
};

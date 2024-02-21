// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('radix-developer-tools.helloScrypto', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello from Radix Developer Tools!');
	});

	class ScryptoTreeDataProvider implements vscode.TreeDataProvider<string> {
		private items: { label: string, icon: string, command: string }[];

		constructor(items: { label: string, icon: string, command: string }[]) {
			this.items = items;
		}

		getTreeItem(element: string): vscode.TreeItem {
			const item = this.items.find(item => item.label === element);
			if (item) {
				return {
					label: item.label,
					iconPath: vscode.Uri.file(path.join(__dirname, item.icon)),
					id: item.label,
					collapsibleState: vscode.TreeItemCollapsibleState.None,
					command: {
						command: item.command,
						title: item.label,
						arguments: [item.label]
					}
				};
			}
			return new vscode.TreeItem(element);
		}

		getChildren(element?: string): Thenable<string[]> {
			if (element) {
				return Promise.resolve([]);
			} else {
				return Promise.resolve(this.items.map(item => item.label));
			}
		}
	}

	// Tree View Items
	const templates = [
		{ label: 'Scrypto Package', icon: '../resources/Scrypto.svg', command: 'scrypto.new-package' },
		{ label: 'Create Radix dApp', icon: '../resources/Scrypto.svg', command: 'create-radix-dapp' },
	];
	const resimCmd = [
		{ label: 'Resim New Account', icon: '../resources/Scrypto.svg', command: 'resim.new-account' },
		{ label: 'Resim Reset', icon: '../resources/Scrypto.svg', command: 'resim.reset' },
		{ label: 'Resim Publish', icon: '../resources/Scrypto.svg', command: 'resim.publish' }
		// Create a simple token command
		// Create a fungible token with all behaviors unlocked command
		// Create an NFT command
		// Call a function on a deployed blueprint package command
		// Call a method on a component command
		// Show ledger command
		// Show configs command
		// Resim transfer command
	];

	// Tree View Data Providers
	const templateTreeDataProvider = new ScryptoTreeDataProvider(templates);
	const resimTreeDataProvider = new ScryptoTreeDataProvider(resimCmd);

	// ######### Create New Project Commands #########
	// ######### Scrypto Package Command #########
	// TODO - add a check to see if the package already exists
	// TODO - add a check to see if the terminal is already open
	// TODO - add a prompt to ask for the package name in resim instead of the input box
	context.subscriptions.push(vscode.commands.registerCommand('scrypto.new-package', async (label) => {
		const packageName = await vscode.window.showInputBox({
			prompt: 'Enter the package name',
			placeHolder: 'scrypto-package'
		});

		if (packageName) {
			const terminal = vscode.window.createTerminal(`Scrypto-CLI`);
			terminal.sendText(`scrypto new-package ${packageName}`);
			terminal.show();
			vscode.window.showInformationMessage(`Created ${label}`);
		}
	}));

	// ######### Create Radix Dapp Command #########
	context.subscriptions.push(vscode.commands.registerCommand('create-radix-dapp', (label) => {
		const terminal = vscode.window.createTerminal(`Radix-Dapp`);
		terminal.sendText("npx create-radix-dapp");
		terminal.show();
	}));

	// ######### Resim Commands #########
	// TODO - add a check to see if the terminal location contains the scrypto-package and if not,
	// prompt the user to provide the location

	// Resim New Account Command
	context.subscriptions.push(vscode.commands.registerCommand('resim.new-account', (label) => {
		// check if there is a resim terminal open already
		let isResimTerminalOpen = false;
		vscode.window.terminals.forEach(terminal => {
			if (terminal.name === 'Resim') {
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
	}));

	// Resim Reset Command
	context.subscriptions.push(vscode.commands.registerCommand('resim.reset', (label) => {
		// check if there is a resim terminal open already
		let isResimTerminalOpen = false;
		vscode.window.terminals.forEach(terminal => {
			if (terminal.name === 'Resim') {
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
	}));

	// Resim Publish Package Command
	// TODO - add a check to see if the terminal location contains the scrypto-package
	context.subscriptions.push(vscode.commands.registerCommand('resim.publish', (label) => {
		// check if there is a resim terminal open already
		let isResimTerminalOpen = false;
		vscode.window.terminals.forEach(terminal => {
			if (terminal.name === 'Resim') {
				terminal.sendText("cd scrypto-package && resim publish .");
				terminal.show();
				isResimTerminalOpen = true;
				return;
			}
		});
		// if not create a new one
		if (!isResimTerminalOpen) {
			const terminal = vscode.window.createTerminal(`Resim`);
			terminal.sendText("cd scrypto-package && resim publish .");
			terminal.show();
		}
	}));

	// Add tree views to the extension context
	context.subscriptions.push(disposable);
	context.subscriptions.push(vscode.window.registerTreeDataProvider('create-new-project', templateTreeDataProvider));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('resim-commands', resimTreeDataProvider));
}

// This method is called when your extension is deactivated
export function deactivate() { }

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
		private items: { label: string, icon: vscode.ThemeIcon | string, command: string }[];

		constructor(items: { label: string, icon: vscode.ThemeIcon | string, command: string }[]) {
			this.items = items;
		}

		getTreeItem(element: string): vscode.TreeItem {
			const item = this.items.find(item => item.label === element);
			if (item) {
				let iconPath: vscode.ThemeIcon | vscode.Uri;
				if (typeof item.icon === 'string') {
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

	// vscode.ThemeIcon - https://code.visualstudio.com/api/references/icons-in-labels
	const account_icon = new vscode.ThemeIcon('account');
	const reset_icon = new vscode.ThemeIcon('refresh');
	const package_icon = new vscode.ThemeIcon('package');
	const publish_icon = new vscode.ThemeIcon('repo-push');
	const dapp_icon = new vscode.ThemeIcon('empty-window');
	const configs_icon = new vscode.ThemeIcon('settings-gear');
	const ledger_icon = new vscode.ThemeIcon('list-flat');
	const transfer_icon = new vscode.ThemeIcon('symbol-boolean');
	const fungible_token_icon = new vscode.ThemeIcon('symbol-constant');
	const call_function_icon = new vscode.ThemeIcon('symbol-function');
	const call_method_icon = new vscode.ThemeIcon('symbol-method');
	const nft_badge_icon = new vscode.ThemeIcon('verified-filled');
	const fungible_token_behaviors_icon = new vscode.ThemeIcon('symbol-misc');
	// Tree View Items
	const templates = [
		{ label: 'Scrypto Package', icon: package_icon, command: 'scrypto.new-package' },
		{ label: 'Create Radix dApp', icon: dapp_icon, command: 'create-radix-dapp' },
	];
	const resimCmd = [
		{ label: 'New Account', icon: account_icon, command: 'resim.new-account' },
		{ label: 'Reset', icon: reset_icon, command: 'resim.reset' },
		{ label: 'Publish', icon: publish_icon, command: 'resim.publish' },
		{ label: 'Show Configs', icon: configs_icon, command: 'resim.show-configs' },
		{ label: 'Show Ledger', icon: ledger_icon, command: 'resim.show-ledger' },
		{ label: 'Transfer', icon: transfer_icon, command: 'resim.transfer' },
		{ label: 'Create Fungible Token', icon: fungible_token_icon, command: 'resim.new-token-fixed' },
		{ label: 'Call Function', icon: call_function_icon, command: 'resim.call-function' },
		{ label: 'Call Method', icon: call_method_icon, command: 'resim.call-method' },
		{ label: 'Create NFT Badge', icon: nft_badge_icon, command: 'resim.create-nft-badge' },
		{ label: 'Create Fungible w/Behaviors', icon: fungible_token_behaviors_icon, command: 'resim.new-token-behaviors' },
	];
	const stokenetCmd = [
		{ label: 'New Account', icon: account_icon, command: 'stokenet.new-account' },
		{ label: 'Get XRD', icon: reset_icon, command: 'stokenet.faucet' },
		{ label: 'Deploy Package', icon: publish_icon, command: 'stokenet.deploy-package' },
		{ label: 'Instantiate Blueprint', icon: ledger_icon, command: 'stokenet.instantiate-blueprint' },
	];

	// Tree View Data Providers
	const templateTreeDataProvider = new ScryptoTreeDataProvider(templates);
	const resimTreeDataProvider = new ScryptoTreeDataProvider(resimCmd);
	const stokenetTreeDataProvider = new ScryptoTreeDataProvider(stokenetCmd);

	// ######### Create New Project Commands #########
	// ######### Scrypto Package Command #########
	context.subscriptions.push(vscode.commands.registerCommand('scrypto.new-package', async (label) => {
		const packageName = await vscode.window.showInputBox({
			prompt: 'Enter the package name',
			placeHolder: 'scrypto-package',
			value: '',
			ignoreFocusOut: true,
			valueSelection: [-1, -1]
		}) || 'scrypto-package';

		if (packageName) {
			const terminal = vscode.window.createTerminal(`Scrypto-CLI`);
			terminal.sendText(`scrypto new-package ${packageName}`);
			terminal.show();
		}
	}));

	// ######### Create Radix Dapp Command #########
	context.subscriptions.push(vscode.commands.registerCommand('create-radix-dapp', (label) => {
		const terminal = vscode.window.createTerminal(`Radix-Dapp`);
		terminal.sendText("npx create-radix-dapp");
		terminal.show();
	}));


	// ######### Resim Commands #########
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

	// Resim Show Configs Command
	context.subscriptions.push(vscode.commands.registerCommand('resim.show-configs', (label) => {
		// check if there is a resim terminal open already
		let isResimTerminalOpen = false;
		vscode.window.terminals.forEach(terminal => {
			if (terminal.name === 'Resim') {
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
	}));

	// Resim Show Ledger Command
	context.subscriptions.push(vscode.commands.registerCommand('resim.show-ledger', (label) => {
		// check if there is a resim terminal open already
		let isResimTerminalOpen = false;
		vscode.window.terminals.forEach(terminal => {
			if (terminal.name === 'Resim') {
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
	}));

	// Resim Transfer Command
	// resim transfer [OPTIONS] <RESOURCE_ADDRESS>:<AMOUNT> <RECIPIENT>
	context.subscriptions.push(vscode.commands.registerCommand('resim.transfer', async (label) => {
		// TODO - Add validation to the input boxes to statically check for the correct input
		const resourceAddress = await vscode.window.showInputBox({ prompt: 'Enter the resource address for the resource you wish to transfer', ignoreFocusOut: true });
		const amount = await vscode.window.showInputBox({ prompt: 'Enter the amount you wish to transfer', ignoreFocusOut: true });
		const recipientAccount = await vscode.window.showInputBox({ prompt: 'Enter the recipient account address', ignoreFocusOut: true });

		if (resourceAddress && amount && recipientAccount) {
			const command = `resim transfer ${resourceAddress}:${amount} ${recipientAccount}`;

			// check if there is a resim terminal open already
			let isResimTerminalOpen = false;
			vscode.window.terminals.forEach(terminal => {
				if (terminal.name === 'Resim') {
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
			vscode.window.showErrorMessage('You must provide a resource address, amount, and recipient account');
		}
	}));

	// Resim Publish Package Command
	// TODO - add a check to see if the terminal location contains the scrypto-package
	context.subscriptions.push(vscode.commands.registerCommand('resim.publish', async (label) => {
		// Prompt for the relative path to the package
		const packagePath = await vscode.window.showInputBox({
			prompt: 'Enter the relative path to the package',
			ignoreFocusOut: true
		});
		if (packagePath) {
			const terminal = vscode.window.createTerminal(`Publish Package`);
			terminal.sendText(`cd ${packagePath} && resim publish .`);
			terminal.show();
		}
		else {
			const terminal = vscode.window.createTerminal(`Publish Package`);
			terminal.sendText(`resim publish .`);
			terminal.show();
		}
	}));

	// Resim New Simple Fungible Token Fixed Supply Command
	context.subscriptions.push(vscode.commands.registerCommand('resim.new-token-fixed', async (label) => {
		// TODO - Add validation to the input boxes to statically check for the correct input
		const amount = await vscode.window.showInputBox({ prompt: 'Enter the amount', ignoreFocusOut: true });

		if (amount) {
			const command = `resim new-token-fixed ${amount}`;

			// check if there is a resim terminal open already
			let isResimTerminalOpen = false;
			vscode.window.terminals.forEach(terminal => {
				if (terminal.name === 'Resim') {
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
			vscode.window.showErrorMessage('You must provide an amount of tokens to create');
		}
	}));

	// Resim Call Function Command
	// resim call-function <package_address> <blueprint_name> <function> <args>
	context.subscriptions.push(vscode.commands.registerCommand('resim.call-function', async (label) => {
		// TODO - Add validation to the input boxes to statically check for the correct input
		const packageAddress = await vscode.window.showInputBox({ prompt: 'Enter the package address', ignoreFocusOut: true });
		const blueprintName = await vscode.window.showInputBox({ prompt: 'Enter the blueprint name', ignoreFocusOut: true });
		const functionName = await vscode.window.showInputBox({ prompt: 'Enter the function name', ignoreFocusOut: true });
		// TODO add logic to handle multiple arguments more elegantly
		const args = await vscode.window.showInputBox({ prompt: 'Enter the function arguments seperated by a blank space', ignoreFocusOut: true });

		if (packageAddress && blueprintName && functionName) {
			const command = `resim call-function ${packageAddress} ${blueprintName} ${functionName} ${args}`;

			// check if there is a resim terminal open already
			let isResimTerminalOpen = false;
			vscode.window.terminals.forEach(terminal => {
				if (terminal.name === 'Resim') {
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
			vscode.window.showErrorMessage('You must provide a package address, blueprint name, function name and any required arguments');
		}
	}));

	// Resim Call Method Command
	// resim call-method <component_address> <method> <args>
	context.subscriptions.push(vscode.commands.registerCommand('resim.call-method', async (label) => {
		// TODO - Add validation to the input boxes to statically check for the correct input
		const componentAddress = await vscode.window.showInputBox({ prompt: 'Enter the component address', ignoreFocusOut: true });
		const methodName = await vscode.window.showInputBox({ prompt: 'Enter the method name', ignoreFocusOut: true });
		// TODO add logic to handle multiple arguments more elegantly
		const args = await vscode.window.showInputBox({ prompt: 'Enter the method arguments seperated by a blank space', ignoreFocusOut: true });

		if (componentAddress && methodName) {
			const command = `resim call-method ${componentAddress} ${methodName} ${args}`;

			// check if there is a resim terminal open already
			let isResimTerminalOpen = false;
			vscode.window.terminals.forEach(terminal => {
				if (terminal.name === 'Resim') {
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
			vscode.window.showErrorMessage('You must provide a component address, method name, and any required arguments');
		}
	}));

	// Resim Create Simple NFT Badge Command
	// resim new-simple-badge
	context.subscriptions.push(vscode.commands.registerCommand('resim.create-nft-badge', async (label) => {
		const command = `resim new-simple-badge`;

		// check if there is a resim terminal open already
		let isResimTerminalOpen = false;
		vscode.window.terminals.forEach(terminal => {
			if (terminal.name === 'Resim') {
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
	}));

	// Resim Create Fungible Token with Behaviors Command
	// resim run create-fungible-token-with-behaviors.rtm
	// TODO - Create custom manifest file for the behaviors
	context.subscriptions.push(vscode.commands.registerCommand('resim.new-token-behaviors', async (label) => {
		// Test with simple manifest first
		const command = `resim run ${__dirname}/assets/manifests/token_behaviors.rtm`;

		// check if there is a resim terminal open already
		let isResimTerminalOpen = false;
		vscode.window.terminals.forEach(terminal => {
			if (terminal.name === 'Resim') {
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
	}));

	// ######### Stokenet Commands #########
	context.subscriptions.push(vscode.commands.registerCommand('stokenet.new-account', (label) => {
		vscode.window.showInformationMessage('Stokenet New Account');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('stokenet.faucet', (label) => {
		vscode.window.showInformationMessage('Stokenet Get XRD');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('stokenet.deploy-package', (label) => {
		vscode.window.showInformationMessage('Stokenet Deploy Package');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('stokenet.instantiate-blueprint', (label) => {
		vscode.window.showInformationMessage('Stokenet Instantiate Blueprint');
	}));

	// Add tree views to the extension context
	context.subscriptions.push(disposable);
	context.subscriptions.push(vscode.window.registerTreeDataProvider('create-new-project', templateTreeDataProvider));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('resim-commands', resimTreeDataProvider));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('stokenet-commands', stokenetTreeDataProvider));
}

// This method is called when your extension is deactivated
export function deactivate() { }

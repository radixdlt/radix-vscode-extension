// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { createAccount, airdropXRD } from "./helpers/create-account";
import { deployPackage } from "./helpers/deploy-package";
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('radix-developer-tools.helloScrypto', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello from Radix Developer Tools!');
	});

	class ScryptoTreeDataProvider implements vscode.TreeDataProvider<string> {
		private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> = new vscode.EventEmitter<string | undefined | null | void>();
		readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;

		private items: { label: string, icon: vscode.ThemeIcon | string, command: vscode.Command }[];

		constructor(items: { label: string, icon: vscode.ThemeIcon | string, command: vscode.Command }[]) {
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
						command: item.command.command,
						title: item.command.title,
						arguments: [item.command.arguments]
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
		// method to add new items to the tree view and refresh the view
		addNewItem(item: { label: string, icon: vscode.ThemeIcon | string, command: vscode.Command }) {
			this.items.push(item);
			this._onDidChangeTreeData.fire();
		}
		// method to remove items from the tree view and refresh the view
		removeItem(label: string) {
			this.items = this.items.filter(item => item.label !== label);
			this._onDidChangeTreeData.fire();
		}
	}

	// This is the webview template for the stokenet account detail view
	function getWebviewContent(accountName: string, virtualAccount: string, mnemonic: string, privateKey: string, publicKey: string) {
		return `
        <h1>Stokenet Account</h1>
		<p> View the details of an account by clicking on the account name in the Stokenet Accounts tree view panel.</p>
		<h3>Account Name: ${accountName}</h3>
        <p><strong>Account Address:</strong> ${virtualAccount}</p>
        <p>Mnemonic: ${mnemonic}</p>
        <p>Private Key: ${privateKey}</p>
        <p>Public Key: ${publicKey}</p>
		<a href="https://stokenet-dashboard.radixdlt.com/account/${virtualAccount}/tokens">View Account on Dashboard</a>
    `;
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
	const trash = new vscode.ThemeIcon('trash');
	const dashboard_icon = new vscode.ThemeIcon('dashboard');
	const console_icon = new vscode.ThemeIcon('preview');

	// Tree View Items
	const templates = [
		{ label: 'Scrypto Package', icon: package_icon, command: { command: 'scrypto.new-package', title: 'Scrypto New Package', arguments: [] } },
		{ label: 'Create Radix dApp', icon: dapp_icon, command: { command: 'create-radix-dapp', title: 'Create Radix dApp', arguments: [] } },
	];
	const resimCmd = [
		{ label: 'New Account', icon: account_icon, command: { command: 'resim.new-account', title: 'New Account', arguments: [] } },
		{ label: 'Reset', icon: reset_icon, command: { command: 'resim.reset', title: 'Reset', arguments: [] } },
		{ label: 'Publish', icon: publish_icon, command: { command: 'resim.publish', title: 'Publish', arguments: [] } },
		{ label: 'Show Configs', icon: configs_icon, command: { command: 'resim.show-configs', title: 'Show Configs', arguments: [] } },
		{ label: 'Show Ledger', icon: ledger_icon, command: { command: 'resim.show-ledger', title: 'Show Ledger', arguments: [] } },
		{ label: 'Transfer', icon: transfer_icon, command: { command: 'resim.transfer', title: 'Transfer', arguments: [] } },
		{ label: 'Create Fungible Token', icon: fungible_token_icon, command: { command: 'resim.new-token-fixed', title: 'Create Fungible Token', arguments: [] } },
		{ label: 'Call Function', icon: call_function_icon, command: { command: 'resim.call-function', title: 'Call Function', arguments: [] } },
		{ label: 'Call Method', icon: call_method_icon, command: { command: 'resim.call-method', title: 'Call Method', arguments: [] } },
		{ label: 'Create NFT Badge', icon: nft_badge_icon, command: { command: 'resim.create-nft-badge', title: 'Create NFT Badge', arguments: [] } },
		{ label: 'Create Fungible w/Behaviors', icon: fungible_token_behaviors_icon, command: { command: 'resim.new-token-behaviors', title: 'Create Fungible w/Behaviors', arguments: [] } },
	];
	const stokenetCmd = [
		{ label: 'New Account', icon: account_icon, command: { command: 'stokenet.new-account', title: 'New Account', arguments: [] } },
		{ label: 'Get XRD', icon: transfer_icon, command: { command: 'stokenet.faucet', title: 'Airdrop XRD', arguments: [] } },
		{ label: 'Deploy Package', icon: publish_icon, command: { command: 'stokenet.deploy-package', title: 'Deploy Package', arguments: [] } },
		// { label: 'Instantiate Blueprint', icon: ledger_icon, command: { command: 'stokenet.instantiate-blueprint', title: 'Instantiate Blueprint', arguments: [] } },
		{ label: 'Open Dashboard', icon: dashboard_icon, command: { command: 'stokenet.dashboard', title: 'Open Dashboard', arguments: [] } },
		{ label: 'Open Dev Console', icon: console_icon, command: { command: 'stokenet.console', title: 'Open Console', arguments: [] } },
		{ label: 'Remove Account', icon: trash, command: { command: 'stokenet.remove-account', title: 'Remove Account', arguments: [] } },
	];
	let stokenetAccountsList: { label: string, icon: vscode.ThemeIcon, command: { command: string, title: string, arguments: string[] } }[] = [];
	let stokenetAccounts: { accountName: string, virtualAccount: string, mnemonic: string, privateKey: string, publicKey: string }[] = [];
	stokenetAccounts = context.globalState.get('stokenet-accounts') || [];
	// set stokenet accounts list from the global context
	stokenetAccountsList.push(...stokenetAccounts.map(account => {
		return { label: account.accountName, icon: account_icon, command: { command: 'account.account-detail', title: 'Account Detail', arguments: [account.virtualAccount] } };
	}));

	// Tree View Data Providers
	const templateTreeDataProvider = new ScryptoTreeDataProvider(templates);
	const resimTreeDataProvider = new ScryptoTreeDataProvider(resimCmd);
	const stokenetTreeDataProvider = new ScryptoTreeDataProvider(stokenetCmd);
	const stokenetAccountsTreeDataProvider = new ScryptoTreeDataProvider(stokenetAccountsList);

	// ######### Create New Project Commands #########
	// ######### Scrypto Package Command #########
	context.subscriptions.push(vscode.commands.registerCommand('scrypto.new-package', async () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('create-radix-dapp', () => {
		const terminal = vscode.window.createTerminal(`Radix-Dapp`);
		terminal.sendText("npx create-radix-dapp");
		terminal.show();
	}));


	// ######### Resim Commands #########
	// Resim New Account Command
	context.subscriptions.push(vscode.commands.registerCommand('resim.new-account', () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.reset', () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.show-configs', () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.show-ledger', () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.transfer', async () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.publish', async () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.new-token-fixed', async () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.call-function', async () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.call-method', async () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.create-nft-badge', async () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('resim.new-token-behaviors', async () => {
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
	context.subscriptions.push(vscode.commands.registerCommand('stokenet.new-account', async () => {
		// prompt the user for an account name
		const accountName = await vscode.window.showInputBox({ prompt: 'Enter the account name', ignoreFocusOut: true });
		if (accountName) {
			// Create a new account and airdrop it with XRD
			createAccount().then(({ virtualAccount, mnemonic, privateKey, publicKey }) => {
				// Add the account to the stokenet accounts tree view
				stokenetAccountsTreeDataProvider.addNewItem({ label: accountName, icon: account_icon, command: { command: 'account.account-detail', title: 'Account Detail', arguments: [virtualAccount] } });
				// Add the account to global context
				stokenetAccounts.push({ accountName, virtualAccount, mnemonic, privateKey, publicKey });
				context.globalState.update('stokenet-accounts', stokenetAccounts);

				// Create and show a new webview
				const panel = vscode.window.createWebviewPanel(
					'stokenetAccount', // Identifies the type of the webview. Used internally
					accountName, // Title of the panel displayed to the user
					vscode.ViewColumn.One, // Editor column to show the new webview panel in.
					{} // Webview options. More on these later.
				);
				// Set its HTML content
				panel.webview.html = getWebviewContent(accountName, virtualAccount, mnemonic, privateKey, publicKey);
			});
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('stokenet.faucet', async () => {
		// prompt the user for the account address to send the XRD to using AirdropXRD
		const accountAddress = await vscode.window.showInputBox({ prompt: 'Enter the account address to send XRD to', ignoreFocusOut: true });
		if (accountAddress) {
			airdropXRD(accountAddress);
			vscode.window.showInformationMessage(`Sending XRD to account: ${accountAddress}`);
		}
		// TODO show account entity details from gateway
	}));

	context.subscriptions.push(vscode.commands.registerCommand('stokenet.deploy-package', async () => {
		// prompt the user for the package path
		const packagePath = await vscode.window.showInputBox({ prompt: 'Enter the path to the package', ignoreFocusOut: true });
		const blueprintModName = await vscode.window.showInputBox({ prompt: 'Enter the blueprint mod name', ignoreFocusOut: true });
		const payerAccount = await stokenetAccounts[0];
		// check if the path is valid if not display an error message
		const packageWasmPath = `${packagePath}/target/wasm32-unknown-unknown/release/${blueprintModName}.wasm`;
		const packageRpdPath = `${packagePath}/target/wasm32-unknown-unknown/release/${blueprintModName}.rpd`;

		let wasmPathisValid = fs.existsSync(packageWasmPath);
		let rpdPathisValid = fs.existsSync(packageRpdPath);
		if (!wasmPathisValid || !rpdPathisValid) {
			// Path is invalid, display an error message
			vscode.window.showErrorMessage('Invalid package path or blueprint mod name. Please check the path and ensure you have built the package with the `scypto build` command.');
			return;
		}
		vscode.window.showInformationMessage(`Deploying package to stokenet from @path ${packagePath}`);

		// compose the deploy package transaction and send to gateway
		deployPackage(payerAccount, packageWasmPath, packageRpdPath).then((reciept) => {
			if (reciept && reciept.transaction && reciept.transaction.affected_global_entities) {
				// Create a webview panel
				const panel = vscode.window.createWebviewPanel(
					'stokenetPackage',
					'Stokenet Package',
					vscode.ViewColumn.One,
					{
						enableScripts: true // Enable scripts in the webview
					}
				);

				// Set the HTML content of the webview panel
				panel.webview.html = `
					<html>
					<body>
						<h1>Stokenet Package Deployed Successfully!</h1>
						<p>Package Address: <span id="package-address" onclick="copyPackageAddress()" >${reciept.transaction.affected_global_entities[1]}</span></p>
						<button onclick="copyPackageAddress()">Copy Package Address</button>
						<p>View on the <a href="https://stokenet-dashboard.radixdlt.com/transaction/${reciept.transaction.intent_hash}/details">Stokenet Dashboard</a></p>						
						<script>
							function copyPackageAddress() {
								const packageAddress = document.getElementById('package-address').innerText;
								navigator.clipboard.writeText(packageAddress);
							}
						</script>
					</body>
					</html>
				`;
			}
		});
	}));

	// context.subscriptions.push(vscode.commands.registerCommand('stokenet.instantiate-blueprint', async () => {
	// 	vscode.window.showInformationMessage('Stokenet Instantiate Blueprint');
	// }));

	context.subscriptions.push(vscode.commands.registerCommand('stokenet.dashboard', async () => {
		vscode.env.openExternal(vscode.Uri.parse('https://stokenet-dashboard.radixdlt.com'));
	}));

	context.subscriptions.push(vscode.commands.registerCommand('stokenet.console', async () => {
		vscode.env.openExternal(vscode.Uri.parse('https://stokenet-console.radixdlt.com'));
	}));

	// Remove Account Command
	context.subscriptions.push(vscode.commands.registerCommand('stokenet.remove-account', async () => {
		// Get the stokenetAccounts array from the global context
		stokenetAccounts = await context.globalState.get('stokenet-accounts') || [];
		// Prompt the user to select the account they want to remove
		const accountToRemove = await vscode.window.showQuickPick(stokenetAccounts.map(account => ({
			label: account.accountName,
			description: account.virtualAccount
		})), {
			placeHolder: 'Select the account you want to remove'
		});
		// If an account is selected
		if (accountToRemove) {
			// Remove the selected account from the stokenetAccounts array
			stokenetAccounts = stokenetAccounts.filter(account => account.virtualAccount !== accountToRemove.description);
			// Update the stokenetAccounts array in the global context
			await context.globalState.update('stokenet-accounts', stokenetAccounts);
			// Remove the Item and Refresh the tree view
			stokenetAccountsTreeDataProvider.removeItem(accountToRemove.label);
		}
	}));

	// Stoknet Account Detail Command
	context.subscriptions.push(vscode.commands.registerCommand('account.account-detail', async (virtualAccount: string) => {
		// Get the account details from the global context
		stokenetAccounts = await context.globalState.get('stokenet-accounts') || [];
		// Find the account with matching accountName
		const selectedAccount = stokenetAccounts.find(account => {
			return account.virtualAccount == virtualAccount;
		});
		if (selectedAccount) {
			// Create and show a new webview
			const panel = vscode.window.createWebviewPanel(
				'stokenetAccount', // Identifies the type of the webview. Used internally
				selectedAccount.accountName, // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in.
				{} // Webview options. More on these later.
			);
			// Display the account properties in the webview
			panel.webview.html = getWebviewContent(selectedAccount.accountName, selectedAccount.virtualAccount, selectedAccount.mnemonic, selectedAccount.privateKey, selectedAccount.publicKey);
		} else {
			vscode.window.showErrorMessage('Account not found');
		}
	}));

	// Add tree views to the extension context
	context.subscriptions.push(disposable);
	context.subscriptions.push(vscode.window.registerTreeDataProvider('create-new-project', templateTreeDataProvider));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('resim-commands', resimTreeDataProvider));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('stokenet-commands', stokenetTreeDataProvider));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('stokenet-accounts', stokenetAccountsTreeDataProvider));
}

// This method is called when your extension is deactivated
export function deactivate() { }

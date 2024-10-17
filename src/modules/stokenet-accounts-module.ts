import crypto from "node:crypto";
import * as bip39 from "bip39";
import * as vscode from "vscode";
import { ScryptoTreeDataProvider } from "../helpers/scrypto-tree-data-provider";
import {
  NetworkId,
  PublicKey,
  RadixEngineToolkit,
} from "@radixdlt/radix-engine-toolkit";
import { derivePath, getPublicKey } from "ed25519-hd-key";
import { treeItem } from "../helpers/tree-item";

export type Account = {
  label: string;
  address: string;
  mnemonic: string;
  publicKey: string;
  privateKey: string;
};

/**
 * Responsible for registering all items in "Stokenet Accounts" tree view.
 * Provides functions to deal with account management in extension's global state.
 */
export const StokenetAccountsModule = ({
  context,
}: {
  context: vscode.ExtensionContext;
}) => {
  const GLOBAL_STATE_KEY = "stokenet-accounts-v2";
  const accounts = context.globalState.get<Account[]>(GLOBAL_STATE_KEY) || [];

  const stokenetAccountsList = [
    treeItem(
      "Remove Account",
      "stokenet.remove-account",
      new vscode.ThemeIcon("trash"),
    ),
    ...accounts.map((account) =>
      treeItem(
        account.label,
        "account.account-detail",
        new vscode.ThemeIcon("account"),
        [account.address],
      ),
    ),
  ];

  const treeDataProvider = new ScryptoTreeDataProvider(stokenetAccountsList);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "stokenet-accounts",
      treeDataProvider,
    ),
  );

  const pickAccount = async (
    prompt: string = "Select Account",
  ): Promise<Account | undefined> => {
    const accounts: Account[] = context.globalState.get(GLOBAL_STATE_KEY) || [];

    return vscode.window
      .showQuickPick(
        accounts.map((account) => ({
          label: account.label,
          description: account.address,
          account,
        })),
        {
          placeHolder: prompt,
        },
      )
      .then((selected) => (selected ? selected.account : undefined));
  };

  /**
   * Uses Radix Engine Toolkit and external libraries to create a new Radix account with random mnemonic.
   * After account is derived from randomly generated mnemonic, it is stored in extension's global state and added to tree view.
   */
  const create = async (label: string): Promise<Account> => {
    const privateKeySeed = crypto.randomBytes(32).toString("hex");
    const mnemonic = bip39.entropyToMnemonic(privateKeySeed);
    const mnemonicToSeed = bip39.mnemonicToSeedSync(mnemonic).toString("hex");

    // const DERIVATION_PATH = `m/44'/1022'/${networkId}'/${ENTITY_TYPE.ACCOUNT}'/${KEY_TYPE.TRANSACTION_SIGNING}'/${ENTITY_INDEX}'`
    // the derivation path must be set to the following value to derive the correct key for the virtual account address for each network
    // for example here the /2' is the networkId for stokenet and /525' is the entity type for account
    const derivationPath = "m/44'/1022'/2'/525'/1460'/1'";
    const deriveChildKey = derivePath(derivationPath, mnemonicToSeed);
    const privateKey = deriveChildKey.key.toString("hex");
    const publicKey = getPublicKey(deriveChildKey.key, false).toString("hex");
    // construct RET public key
    const pubKey = new PublicKey.Ed25519(publicKey);
    // derive virtual account address
    const address =
      await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
        pubKey,
        NetworkId.Stokenet,
      );

    const accounts: Account[] = context.globalState.get(GLOBAL_STATE_KEY) || [];

    const newAccount = { address, mnemonic, privateKey, publicKey, label };
    const updatedAccounts = [...accounts, newAccount];

    await context.globalState.update(GLOBAL_STATE_KEY, updatedAccounts);

    treeDataProvider.addNewItem({
      label: newAccount.label,
      icon: new vscode.ThemeIcon("account"),
      command: {
        command: "account.account-detail",
        title: "Account Detail",
        arguments: [newAccount.address],
      },
    });

    return newAccount;
  };

  const remove = async (account: Account): Promise<void> => {
    const accounts: Account[] = context.globalState.get(GLOBAL_STATE_KEY) || [];

    const updatedAccounts = accounts.filter(
      (a) => a.address !== account.address,
    );
    return context.globalState
      .update(GLOBAL_STATE_KEY, updatedAccounts)
      .then(() => treeDataProvider.removeItem(account.label));
  };

  const getAccountByAddress = (address: string): Account | undefined => {
    const accounts: Account[] = context.globalState.get(GLOBAL_STATE_KEY) || [];
    return accounts.find((a) => a.address === address);
  };

  return {
    create,
    remove,
    pickAccount,
    getAccountByAddress,
  };
};

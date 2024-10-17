import crypto from "node:crypto";
import * as bip39 from "bip39";
import * as vscode from "vscode";
import {
  ScryptoTreeDataProvider,
  type ScryptoTreeItem,
} from "./scrypto-tree-data-provider";
import {
  NetworkId,
  PublicKey,
  RadixEngineToolkit,
} from "@radixdlt/radix-engine-toolkit";
import { derivePath, getPublicKey } from "ed25519-hd-key";

export type Account = {
  label: string;
  address: string;
  mnemonic: string;
  publicKey: string;
  privateKey: string;
};

export const StokenetAccountsModule = ({
  context,
}: {
  context: vscode.ExtensionContext;
}) => {
  const GLOBAL_STATE_KEY = "stokenet-accounts-v2";

  const getAccountsAsScryptoTreeItems = (): ScryptoTreeItem[] => {
    const accounts: Account[] = context.globalState.get(GLOBAL_STATE_KEY) || [];
    return accounts.map((account) => ({
      label: account.label,
      icon: new vscode.ThemeIcon("account"),
      command: {
        command: "account.account-detail",
        title: "Account Detail",
        arguments: [account.address],
      },
    }));
  };

  const stokenetAccountsList = [
    {
      label: "Remove Account",
      icon: new vscode.ThemeIcon("trash"),
      command: {
        command: "stokenet.remove-account",
        title: "Remove Account",
        arguments: [],
      },
    },
    ...getAccountsAsScryptoTreeItems(),
  ];

  const stokenetAccountsTreeDataProvider = new ScryptoTreeDataProvider(
    stokenetAccountsList,
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

  const create = async (label: string): Promise<Account> => {
    const privateKeySeed = crypto.randomBytes(32).toString("hex");
    const mnemonic = bip39.entropyToMnemonic(privateKeySeed);
    const mnemonicToSeed = bip39.mnemonicToSeedSync(mnemonic).toString("hex");

    // const DERIVATION_PATH = `m/44'/1022'/${networkId}'/${ENTITY_TYPE.ACCOUNT}'/${KEY_TYPE.TRANSACTION_SIGNING}'/${ENTITY_INDEX}'`
    // the derivation path must be set to the following value to derive the correct key for the virtual account address for each network
    // for example here the /2' is the networkId for stokenet and /525' is the entity type for account
    const derivationPath = "m/44'/1022'/2'/525'/1460'/1'";
    const deriveChildKey = derivePath(derivationPath, mnemonicToSeed);
    const privateKey = await deriveChildKey.key.toString("hex");
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

    stokenetAccountsTreeDataProvider.addNewItem({
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
      .then(() => {
        stokenetAccountsTreeDataProvider.removeItem(account.label);
      });
  };

  const getAccountByAddress = (address: string): Account | undefined => {
    const accounts: Account[] = context.globalState.get(GLOBAL_STATE_KEY) || [];
    return accounts.find((a) => a.address === address);
  };

  const getScryptoTreeDataProvider = () => stokenetAccountsTreeDataProvider;

  return {
    create,
    remove,
    pickAccount,
    getAccountByAddress,
    getScryptoTreeDataProvider,
  };
};

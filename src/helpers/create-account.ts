import crypto from "node:crypto";
import {
  SimpleTransactionBuilder,
  RadixEngineToolkit,
  PublicKey,
  NetworkId,
} from "@radixdlt/radix-engine-toolkit";
import * as bip39 from "bip39";
import { ok } from "neverthrow";
import { derivePath, getPublicKey } from "ed25519-hd-key";
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";
import * as vscode from "vscode";

const gateway = GatewayApiClient.initialize({
  basePath: "https://stokenet.radixdlt.com",
  applicationName: "Radix VSCode Extension",
});

export async function airdropXRD(accountAddress: string) {
  const currentEpoch =
    await gateway.transaction.innerClient.transactionConstruction();
  const faucetTransaction = await SimpleTransactionBuilder.freeXrdFromFaucet({
    networkId: NetworkId.Stokenet,
    validFromEpoch: currentEpoch.ledger_state.epoch,
    toAccount: accountAddress,
  });

  const transctionHex = await faucetTransaction.toHex();
  const intentHash = faucetTransaction.intentHash.id;
  const result = await gateway.transaction.innerClient.transactionSubmit({
    transactionSubmitRequest: {
      notarized_transaction_hex: transctionHex,
    },
  });
}

export async function createAccount() {
  const privateKeySeed = crypto.randomBytes(32).toString("hex");
  const mnemonic = bip39.entropyToMnemonic(privateKeySeed);
  const mnemonicToSeed = ok(bip39.mnemonicToSeedSync(mnemonic).toString("hex"));

  // const DERIVATION_PATH = `m/44'/1022'/${networkId}'/${ENTITY_TYPE.ACCOUNT}'/${KEY_TYPE.TRANSACTION_SIGNING}'/${ENTITY_INDEX}'`
  // the derivation path must be set to the following value to derive the correct key for the virtual account address for each network
  // for example here the /2' is the networkId for stokenet and /525' is the entity type for account
  const derivationPath = "m/44'/1022'/2'/525'/1460'/1'";
  const deriveChildKey = ok(derivePath(derivationPath, mnemonicToSeed.value));
  const privateKey = await deriveChildKey.value.key.toString("hex");
  const publicKey = getPublicKey(deriveChildKey.value.key, false).toString(
    "hex",
  );
  // construct RET public key
  const pubKey = new PublicKey.Ed25519(publicKey);
  // derive virtual account address
  const virtualAccount =
    await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
      pubKey,
      NetworkId.Stokenet,
    );

  airdropXRD(virtualAccount);

  return { virtualAccount, mnemonic, privateKey, publicKey };
}

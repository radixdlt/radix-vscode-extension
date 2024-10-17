import {
  generateRandomNonce,
  NetworkId,
  RadixEngineToolkit,
  TransactionHeader,
  PrivateKey,
  TransactionBuilder,
  Convert,
  TransactionManifest,
} from "@radixdlt/radix-engine-toolkit";
import fs from "fs";
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";
import { Account } from "./stokenet-accounts";

const gateway = GatewayApiClient.initialize({
  basePath: "https://stokenet.radixdlt.com",
  applicationName: "Radix VSCode Extension",
});

// TODO return error if the transaction fails
export async function submitTransaction(
  payerAccount: Account,
  rtmPath: string,
) {
  const rtmFile = fs.readFileSync(rtmPath);

  const payerAccountPrivateKey = payerAccount.privateKey;
  const notaryPrivateKey = new PrivateKey.Ed25519(payerAccountPrivateKey);

  const manifest: TransactionManifest = {
    instructions: {
      kind: "String",
      value: rtmFile.toString(),
    },
    blobs: [],
  };

  // Get the current epoch and build a transaction header
  const currentEpoch =
    await gateway.transaction.innerClient.transactionConstruction();
  const transactionHeader: TransactionHeader = {
    networkId: NetworkId.Stokenet,
    startEpochInclusive: currentEpoch.ledger_state.epoch,
    endEpochExclusive: currentEpoch.ledger_state.epoch + 10,
    nonce: await generateRandomNonce(),
    notaryPublicKey: notaryPrivateKey.publicKey(),
    notaryIsSignatory: true,
    tipPercentage: 0,
  };

  // Sign and notarize the transaction
  const signedTransaction = await TransactionBuilder.new().then((builder) =>
    builder
      .header(transactionHeader)
      .manifest(manifest)
      .sign(notaryPrivateKey)
      .notarize(notaryPrivateKey),
  );

  const transactionId =
    await RadixEngineToolkit.NotarizedTransaction.intentHash(signedTransaction);

  try {
    const compiledTransaction =
      await RadixEngineToolkit.NotarizedTransaction.compile(signedTransaction);

    const result = await gateway.transaction.innerClient.transactionSubmit({
      transactionSubmitRequest: {
        notarized_transaction_hex:
          Convert.Uint8Array.toHexString(compiledTransaction),
      },
    });

    let transactionStatus = await gateway.transaction.getStatus(
      transactionId.id,
    );
    while (transactionStatus.status === "Pending") {
      // TODO Show a spinner
      transactionStatus = await gateway.transaction.getStatus(transactionId.id);
    }

    return transactionId.id;
  } catch (e) {
    return transactionId.id;
  }
}

import {
    generateRandomNonce,
    NetworkId,
    RadixEngineToolkit,
    ManifestSborStringRepresentation,
    TransactionHeader,
    PrivateKey,
    TransactionBuilder,
    // defaultValidationConfig,
    Convert,
    hash,
    TransactionManifest,
} from "@radixdlt/radix-engine-toolkit";
import fs from "fs";
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";


const gateway = GatewayApiClient.initialize({
    basePath: "https://stokenet.radixdlt.com",
    applicationName: "Radix VSCode Extension",
});

type accountObject = {
    accountName: string,
    virtualAccount: string,
    mnemonic: string,
    privateKey: string,
    publicKey: string,
};

export async function deployPackage(payerAccount: accountObject, packageWasmPath: string, packageRpdPath: string) {
    const packageWasmBuffer = fs.readFileSync(packageWasmPath);
    const packageRpdBuffer = fs.readFileSync(packageRpdPath);
    const payerAccountAddress = payerAccount.virtualAccount;
    const payerAccountPrivateKey = payerAccount.privateKey;
    const notaryPrivateKey = new PrivateKey.Ed25519(
        payerAccountPrivateKey
    );
    const rpdDecoded = (await RadixEngineToolkit.ManifestSbor.decodeToString(packageRpdBuffer, 2, ManifestSborStringRepresentation.ManifestString));
    // ****** TODO ***** Re-visit doing this with the ManifestBuilder vs the string conversion when toolkit gets updated ***** 
    /*     const manifest = new ManifestBuilder()
            .callMethod(payerAccountAddress, "lock_fee", [decimal(100)])
            .callFunction(
                "package_tdx_2_1pkgxxxxxxxxxpackgexxxxxxxxx000726633226xxxxxxxxxehawfs",
                "Package",
                "publish_wasm",
                [str(rpdDecoded), blob(hash(packageWasmBuffer)), map(ValueKind.Tuple, ValueKind.Tuple),]
            )
            .build();
        manifest.blobs = [packageWasmBuffer];
        console.log("manifest: ", manifest); */

    const manifest: TransactionManifest = {
        instructions: {
            kind: "String",
            value: `
      CALL_METHOD
          Address("${payerAccountAddress}")
          "lock_fee"
          Decimal("200")
      ;
      PUBLISH_PACKAGE
          ${rpdDecoded}
          Blob("${Convert.Uint8Array.toHexString(hash(packageWasmBuffer))}")
          Map<String, Tuple>()
      ;
      CALL_METHOD
        Address("${payerAccountAddress}")
        "deposit_batch"
        Expression("ENTIRE_WORKTOP");
      `,
        },
        blobs: [packageWasmBuffer],
    };

    // Get the current epoch and build a transaction header
    const currentEpoch = await gateway.transaction.innerClient.transactionConstruction();
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
    const signedTransaction = await TransactionBuilder.new().then(
        (builder) =>
            builder
                .header(transactionHeader)
                .manifest(manifest)
                .sign(notaryPrivateKey)
                .notarize(notaryPrivateKey)
    );

    const transactionId = await RadixEngineToolkit.NotarizedTransaction.intentHash(
        signedTransaction
    );

    // Check that the transaction that we've just built is statically valid.
    // This is a useful check to ensure that the transaction will be accepted by the Radix Engine.
    // This is an optional step but can be useful for debugging.
    /*     await RadixEngineToolkit.NotarizedTransaction.staticallyValidate(
            signedTransaction,
            defaultValidationConfig(NetworkId.Stokenet)
        ).then((validation) => {
            if (validation.kind === "Invalid") {
                throw new Error("Transaction is invalid");
            }
        }); */

    const compiledTransaction = await RadixEngineToolkit.NotarizedTransaction.compile(signedTransaction);

    const result = await gateway.transaction.innerClient.transactionSubmit({
        transactionSubmitRequest: {
            notarized_transaction_hex: Convert.Uint8Array.toHexString(compiledTransaction),
        }
    });

    let transactionStatus = await gateway.transaction.getStatus(transactionId.id);
    while (transactionStatus.status === 'Pending') {
        // TODO Show a spinner
        transactionStatus = await gateway.transaction.getStatus(transactionId.id);
    }

    const reciept = await gateway.transaction.getCommittedDetails(transactionId.id);
    return reciept;
};

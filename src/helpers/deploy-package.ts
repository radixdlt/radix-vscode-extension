import {
    generateRandomNonce,
    NetworkId,
    ManifestBuilder,
    blob,
    RadixEngineToolkit,
    ManifestSborStringRepresentation,
    str,
    decimal,
    TransactionHeader,
    PrivateKey,
    TransactionBuilder,
    defaultValidationConfig,
    Convert,
    Expression,
    bucket
} from "@radixdlt/radix-engine-toolkit";
import fs from "fs";
import { GatewayApiClient } from "@radixdlt/babylon-gateway-api-sdk";
import crypto from "crypto";


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

    const notaryPrivateKey = new PrivateKey.Secp256k1(
        payerAccountPrivateKey
    );

    const rpdDecoded = (await RadixEngineToolkit.ManifestSbor.decodeToString(packageRpdBuffer, 2, ManifestSborStringRepresentation.ManifestString));
    const wasmHash = crypto.createHash("sha256").update(packageWasmBuffer).digest("hex");

    // const faucetAddress = "component_rdx1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxfaucet";

    const manifest = new ManifestBuilder()
        .callMethod(payerAccountAddress, "lock_fee", [decimal(1000)])
        .callFunction(
            "package_tdx_2_1pkgxxxxxxxxxpackgexxxxxxxxx000726633226xxxxxxxxxehawfs",
            "Package",
            "publish_wasm",
            [str(rpdDecoded), blob(wasmHash)]
        )
        .build();
    console.log("Manifest: ", manifest);

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
    console.log("transaction header: ", transactionHeader);

    const signedTransaction = await TransactionBuilder.new().then(
        (builder) =>
            builder
                .header(transactionHeader)
                .manifest(manifest)
                .sign(notaryPrivateKey)
                .notarize(notaryPrivateKey)
    );
    console.log("signed transaction: ", signedTransaction);

    const transactionId = await RadixEngineToolkit.NotarizedTransaction.intentHash(
        signedTransaction
    );
    console.log("transactionID: ", transactionId);

    // Check that the transaction that we've just built is statically valid.
    await RadixEngineToolkit.NotarizedTransaction.staticallyValidate(
        signedTransaction,
        defaultValidationConfig(NetworkId.Stokenet)
    ).then((validation) => {
        console.log("validation: ", validation);
        if (validation.kind === "Invalid") {
            throw new Error("Transaction is invalid");
        }
    });

    const compiledTransaction = await RadixEngineToolkit.NotarizedTransaction.compile(signedTransaction);

    const result = await gateway.transaction.innerClient.transactionSubmit({
        transactionSubmitRequest: {
            notarized_transaction_hex: Convert.Uint8Array.toHexString(compiledTransaction),
        }
    });
    console.log("result: ", result);

};
